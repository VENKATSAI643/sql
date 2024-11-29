const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path'); // For file name manipulation

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'harika',
});

// Sanitize column names
const sanitizeColumnName = (name) => {
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^\d/.test(sanitized)) {
        sanitized = `col_${sanitized}`;
    }
    return sanitized;
};

// Sanitize table name
const sanitizeTableName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
};

app.post('/upload', upload.single('file'), (req, res) => {
    const schema = JSON.parse(req.body.schema);
    const csvFilePath = req.file.path;

    // Use sanitized file name as table name (without extension)
    const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const tableName = sanitizeTableName(fileName);

    // Sanitize column names and build schema
    const sanitizedSchema = schema.map(col => ({
        ...col,
        columnName: sanitizeColumnName(col.columnName),
    }));

    const createTableQuery = `CREATE TABLE ${tableName} (${sanitizedSchema
        .map(
            col =>
                `${col.columnName} ${
                    col.dataType.toUpperCase() === 'VARCHAR' ? 'VARCHAR(255)' : col.dataType
                } ${col.constraints || ''}`
        )
        .join(', ')});`;
    

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to create table.', error: err });
        }

        // Insert data logic...
        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: function (result) {
                const rows = result.data;
                const insertQuery = `INSERT INTO ${tableName} (${sanitizedSchema
                    .map(col => col.columnName)
                    .join(', ')}) VALUES ?`;
                const values = rows.map(row => sanitizedSchema.map(col => row[col.columnName]));

                db.query(insertQuery, [values], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Failed to insert data.', error: err });
                    }
                    res.json({ message: `Table "${tableName}" created and data inserted successfully.` });
                });
            },
        });
    });
});

app.listen(5000, () => console.log('Server running on port 5000'));
