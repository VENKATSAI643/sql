const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer to store files with their original name and CSV extension
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Store uploaded files in the 'uploads' folder
    },
    filename: function (req, file, cb) {
        const fileName = path.basename(file.originalname, path.extname(file.originalname));
        cb(null, `${fileName}.csv`); // Ensure the file name has a .csv extension
    },
});
const upload = multer({ storage: storage });

// Initialize MySQL connection (without specifying the database initially)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
});

// Sanitize column names to prevent SQL injection and invalid names
const sanitizeColumnName = (name) => {
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^\d/.test(sanitized)) {
        sanitized = `col_${sanitized}`;
    }
    return sanitized.toLowerCase();
};

// Sanitize table names similarly
const sanitizeTableName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
};

// Sanitize database names
const sanitizeDatabaseName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
};

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        const schema = JSON.parse(req.body.schema);
        const csvFilePath = req.file.path;
        const databaseName = req.body.databaseName; // Get the database name from the request body

        if (!csvFilePath) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        if (!databaseName || !databaseName.trim()) {
            return res.status(400).json({ message: 'No valid database name provided.' });
        }

        console.log(`CSV File uploaded to: ${csvFilePath}`);

        const sanitizedDatabaseName = sanitizeDatabaseName(databaseName);

        // Create or use the database
        db.query(`CREATE DATABASE IF NOT EXISTS ${sanitizedDatabaseName}`, (err) => {
            if (err) {
                console.error('Error creating database:', err);
                return res.status(500).json({ message: 'Failed to create database.', error: err });
            }

            db.query(`USE ${sanitizedDatabaseName}`, (err) => {
                if (err) {
                    console.error('Error selecting database:', err);
                    return res.status(500).json({ message: 'Failed to select the database.', error: err });
                }

                const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));
                const tableName = sanitizeTableName(fileName);

                const sanitizedSchema = schema.map((col) => ({
                    ...col,
                    columnName: sanitizeColumnName(col.columnName),
                }));

                const createTableQuery = `CREATE TABLE ${tableName} (${sanitizedSchema
                    .map(
                        (col) =>
                            `${col.columnName} ${
                                col.dataType.toUpperCase() === 'VARCHAR' ? 'VARCHAR(255)' : col.dataType
                            } ${col.constraints || ''}`.trim()
                    )
                    .join(', ')});`;

                db.query(createTableQuery, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        return res.status(500).json({ message: 'Failed to create table.', error: err });
                    }

                    fs.readFile(csvFilePath, 'utf8', (err, csvData) => {
                        if (err) {
                            console.error('Error reading CSV file:', err);
                            return res.status(500).json({ message: 'Failed to read CSV file.', error: err });
                        }

                        Papa.parse(csvData, {
                            header: true,
                            skipEmptyLines: true,
                            complete: function (result) {
                                const rows = result.data;

                                const sanitizedHeaders = sanitizedSchema.reduce((acc, col) => {
                                    const matchingHeader = Object.keys(rows[0] || {}).find(
                                        (header) => sanitizeColumnName(header) === col.columnName
                                    );
                                    acc[col.columnName] = matchingHeader || null;
                                    return acc;
                                }, {});

                                const values = rows.map((row) =>
                                    sanitizedSchema.map((col) => row[sanitizedHeaders[col.columnName]] || null)
                                );

                                const insertQuery = `INSERT INTO ${tableName} (${sanitizedSchema
                                    .map((col) => col.columnName)
                                    .join(', ')}) VALUES ?`;

                                db.query(insertQuery, [values], (err) => {
                                    if (err) {
                                        console.error('Error inserting data:', err);
                                        return res.status(500).json({ message: 'Failed to insert data.', error: err });
                                    }

                                    res.json({
                                        message: `Table "${tableName}" created and data inserted successfully.`,
                                    });
                                });
                            },
                            error: (parseError) => {
                                console.error('CSV Parsing Error:', parseError);
                                res.status(500).json({ message: 'Failed to parse CSV file.', error: parseError });
                            },
                        });
                    });
                });
            });
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'An unexpected error occurred.', error: err });
    }
});

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));
