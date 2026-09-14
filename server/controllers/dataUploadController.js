const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const Dataset = require('../models/Dataset');
const { triggerRetrain, getDataStatus } = require('../services/mlService');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

// Expected columns for each dataset type
const DATASET_SCHEMAS = {
  ecommerce_sales: [
    'order_id', 'customer_id', 'product_id', 'category', 'price',
    'discount', 'quantity', 'payment_method', 'order_date',
    'delivery_time_days', 'region', 'returned', 'total_amount',
    'shipping_cost', 'profit_margin', 'customer_age', 'customer_gender'
  ],
  daily_sales_features: [
    'date', 'daily_sales', 'day_of_week', 'day', 'month', 'is_weekend',
    'lag_1', 'lag_7', 'lag_14', 'lag_28', 'rolling_mean_7',
    'rolling_mean_14', 'rolling_std_7'
  ],
  customer_segments: [
    'customer_id', 'Recency', 'Frequency', 'Monetary'
  ]
};

// Helper: count rows in a CSV file
const countCsvRows = (filePath) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', () => count++)
      .on('end', () => resolve(count))
      .on('error', reject);
  });
};

// Helper: read CSV headers
const readCsvHeaders = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headers) => resolve(headers))
      .on('error', reject);
  });
};

// Helper: read first N rows from CSV
const readCsvPreview = (filePath, maxRows = 5) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (rows.length < maxRows) {
          rows.push(row);
        }
        if (rows.length >= maxRows) {
          stream.destroy();
        }
      })
      .on('end', () => resolve(rows))
      .on('close', () => resolve(rows))
      .on('error', reject);
  });
};

// POST /api/data/upload — Upload a CSV file
const uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a CSV file.' });
    }

    const { datasetType } = req.body;
    if (!datasetType || !DATASET_SCHEMAS[datasetType]) {
      // Clean up uploaded file
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'Invalid dataset type. Must be one of: ecommerce_sales, daily_sales_features, customer_segments'
      });
    }

    const uploadedFilePath = req.file.path;

    // Validate CSV headers
    let headers;
    try {
      headers = await readCsvHeaders(uploadedFilePath);
    } catch (parseErr) {
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({ message: 'Failed to parse CSV file. Ensure it is a valid CSV.' });
    }

    // Check required columns exist
    const requiredCols = DATASET_SCHEMAS[datasetType];
    const missingCols = requiredCols.filter(col => !headers.includes(col));
    if (missingCols.length > 0) {
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({
        message: `CSV is missing required columns: ${missingCols.join(', ')}`,
        requiredColumns: requiredCols,
        foundColumns: headers
      });
    }

    // Count rows
    const rowCount = await countCsvRows(uploadedFilePath);
    if (rowCount === 0) {
      fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({ message: 'CSV file contains no data rows.' });
    }

    // Move file to data directory, replacing existing
    const targetPath = path.join(DATA_DIR, `${datasetType}.csv`);
    
    // Backup existing file if present
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(DATA_DIR, `${datasetType}_backup_${Date.now()}.csv`);
      fs.copyFileSync(targetPath, backupPath);
    }

    fs.copyFileSync(uploadedFilePath, targetPath);
    fs.unlinkSync(uploadedFilePath);

    const fileStats = fs.statSync(targetPath);

    // Save/update dataset record in MongoDB
    const datasetRecord = await Dataset.findOneAndUpdate(
      { name: datasetType },
      {
        name: datasetType,
        originalFileName: req.file.originalname,
        rowCount,
        columns: headers,
        fileSize: fileStats.size,
        uploadedBy: req.user?.name || 'Admin',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // Trigger ML retrain in the background
    let retrainResult = null;
    try {
      retrainResult = await triggerRetrain(datasetType);
      datasetRecord.lastRetrained = new Date();
      datasetRecord.status = 'active';
      await datasetRecord.save();
    } catch (retrainErr) {
      console.warn('[DataUpload] ML retrain call failed:', retrainErr.message);
    }

    res.json({
      message: `Dataset "${datasetType}" uploaded successfully with ${rowCount} rows.`,
      dataset: datasetRecord,
      retrainResult,
      preview: await readCsvPreview(targetPath, 3)
    });
  } catch (error) {
    console.error('[DataUpload] Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/data/add-rows — Add individual rows to a dataset
const addRows = async (req, res) => {
  try {
    const { datasetType, rows } = req.body;

    if (!datasetType || !DATASET_SCHEMAS[datasetType]) {
      return res.status(400).json({
        message: 'Invalid dataset type. Must be one of: ecommerce_sales, daily_sales_features, customer_segments'
      });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows provided. Send an array of row objects.' });
    }

    const targetPath = path.join(DATA_DIR, `${datasetType}.csv`);
    
    // Read existing headers or use schema defaults
    let existingHeaders;
    if (fs.existsSync(targetPath)) {
      existingHeaders = await readCsvHeaders(targetPath);
    } else {
      existingHeaders = DATASET_SCHEMAS[datasetType];
    }

    // Build CSV rows string
    const csvLines = rows.map(row => {
      return existingHeaders.map(col => {
        const val = row[col] !== undefined ? String(row[col]) : '';
        // Escape commas and quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });

    // If file doesn't exist, create with headers
    if (!fs.existsSync(targetPath)) {
      const headerLine = existingHeaders.join(',');
      fs.writeFileSync(targetPath, headerLine + '\n' + csvLines.join('\n') + '\n');
    } else {
      // Append rows to existing CSV
      fs.appendFileSync(targetPath, csvLines.join('\n') + '\n');
    }

    // Update row count
    const newRowCount = await countCsvRows(targetPath);
    const fileStats = fs.statSync(targetPath);

    await Dataset.findOneAndUpdate(
      { name: datasetType },
      {
        name: datasetType,
        originalFileName: `${datasetType}.csv`,
        rowCount: newRowCount,
        columns: existingHeaders,
        fileSize: fileStats.size,
        uploadedBy: req.user?.name || 'Admin',
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // Trigger ML retrain
    let retrainResult = null;
    try {
      retrainResult = await triggerRetrain(datasetType);
    } catch (retrainErr) {
      console.warn('[DataUpload] ML retrain after row insert failed:', retrainErr.message);
    }

    res.json({
      message: `Successfully added ${rows.length} row(s) to "${datasetType}". Total rows: ${newRowCount}`,
      rowsAdded: rows.length,
      totalRows: newRowCount,
      retrainResult
    });
  } catch (error) {
    console.error('[DataUpload] Add rows error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/data/datasets — List all available datasets
const listDatasets = async (req, res) => {
  try {
    const datasets = [];

    for (const [name, schema] of Object.entries(DATASET_SCHEMAS)) {
      const filePath = path.join(DATA_DIR, `${name}.csv`);
      const dbRecord = await Dataset.findOne({ name });

      let fileExists = fs.existsSync(filePath);
      let fileSize = 0;
      let rowCount = 0;
      let columns = schema;
      let lastModified = null;

      if (fileExists) {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        lastModified = stats.mtime;
        try {
          rowCount = await countCsvRows(filePath);
          columns = await readCsvHeaders(filePath);
        } catch (e) {
          console.warn(`[DataUpload] Error reading ${name}.csv:`, e.message);
        }
      }

      datasets.push({
        name,
        displayName: name === 'ecommerce_sales' ? 'E-Commerce Sales Data'
          : name === 'daily_sales_features' ? 'Daily Sales Features (Forecasting)'
          : 'Customer Segments (RFM)',
        description: name === 'ecommerce_sales'
          ? 'Core transactional data: orders, products, customers, regions. Powers Dashboard, Recommendations, and Inventory.'
          : name === 'daily_sales_features'
          ? 'Aggregated daily revenue with lag & rolling features. Powers Sales Forecasting models.'
          : 'Customer RFM (Recency, Frequency, Monetary) data. Powers Customer Segmentation.',
        fileExists,
        fileSize,
        rowCount,
        columns,
        requiredColumns: schema,
        lastModified,
        lastRetrained: dbRecord?.lastRetrained || null,
        uploadedBy: dbRecord?.uploadedBy || null,
        uploadedAt: dbRecord?.updatedAt || null,
        status: dbRecord?.status || (fileExists ? 'active' : 'missing')
      });
    }

    // Get ML service data status
    let mlStatus = null;
    try {
      mlStatus = await getDataStatus();
    } catch (e) {
      console.warn('[DataUpload] ML data-status call failed:', e.message);
    }

    res.json({ datasets, mlStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/data/:datasetName — Reset a dataset (restore to empty)
const deleteDataset = async (req, res) => {
  try {
    const { datasetName } = req.params;
    if (!DATASET_SCHEMAS[datasetName]) {
      return res.status(400).json({ message: 'Invalid dataset name' });
    }

    const filePath = path.join(DATA_DIR, `${datasetName}.csv`);
    
    // Backup before deleting
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(DATA_DIR, `${datasetName}_backup_${Date.now()}.csv`);
      fs.copyFileSync(filePath, backupPath);
      fs.unlinkSync(filePath);
    }

    await Dataset.findOneAndDelete({ name: datasetName });

    res.json({ message: `Dataset "${datasetName}" removed. A backup was saved.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/data/retrain — Manually trigger ML re-training
const manualRetrain = async (req, res) => {
  try {
    const { datasetType } = req.body; // optional: specific dataset or 'all'

    const result = await triggerRetrain(datasetType || 'all');

    // Update retrain timestamps
    if (datasetType && datasetType !== 'all') {
      await Dataset.findOneAndUpdate(
        { name: datasetType },
        { lastRetrained: new Date(), status: 'active' }
      );
    } else {
      await Dataset.updateMany({}, { lastRetrained: new Date(), status: 'active' });
    }

    res.json({
      message: 'ML models re-trained successfully on latest data.',
      result
    });
  } catch (error) {
    console.error('[DataUpload] Manual retrain error:', error);
    res.status(500).json({
      message: 'ML re-training failed. Ensure the Python ML service is running.',
      error: error.message
    });
  }
};

// GET /api/data/preview/:datasetName — Preview first rows of a dataset
const previewDataset = async (req, res) => {
  try {
    const { datasetName } = req.params;
    if (!DATASET_SCHEMAS[datasetName]) {
      return res.status(400).json({ message: 'Invalid dataset name' });
    }

    const filePath = path.join(DATA_DIR, `${datasetName}.csv`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dataset file not found on disk.' });
    }

    const rows = await readCsvPreview(filePath, 10);
    const headers = await readCsvHeaders(filePath);

    res.json({ datasetName, headers, rows, previewRowCount: rows.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDataset,
  addRows,
  listDatasets,
  deleteDataset,
  manualRetrain,
  previewDataset
};
