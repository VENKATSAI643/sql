import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

const UploadCSV = () => {
    const [columns, setColumns] = useState([]);
    const [schema, setSchema] = useState([]);
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const csvFile = e.target.files[0];
        setFile(csvFile);

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: function (result) {
                const colNames = Object.keys(result.data[0]);
                setColumns(colNames);
                setSchema(colNames.map(name => ({ columnName: name, dataType: 'VARCHAR', constraints: '' })));
            },
        });
    };

    const handleSchemaChange = (index, field, value) => {
        const updatedSchema = [...schema];
        updatedSchema[index][field] = value;
        setSchema(updatedSchema);
    };

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('schema', JSON.stringify(schema));

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(response.data.message);
        } catch (error) {
            console.error(error);
            alert('Failed to upload data.');
        }
    };

    return (
        <div>
            <h1>Upload CSV and Define Schema</h1>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            {columns.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Column Name</th>
                            <th>Data Type</th>
                            <th>Constraints</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schema.map((col, index) => (
                            <tr key={index}>
                                <td>{col.columnName}</td>
                                <td>
                                    <select
                                        value={col.dataType}
                                        onChange={(e) => handleSchemaChange(index, 'dataType', e.target.value)}
                                    >
                                        <option value="INT">INT</option>
                                        <option value="VARCHAR">VARCHAR</option>
                                        <option value="TEXT">TEXT</option>
                                        <option value="DATE">DATE</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        placeholder="e.g., PRIMARY KEY"
                                        value={col.constraints}
                                        onChange={(e) => handleSchemaChange(index, 'constraints', e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};

export default UploadCSV;
