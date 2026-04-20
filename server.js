const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./barber.db');

db.serialize(() => {
    // Services Table
    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        duration INTEGER
    )`);
    // Active Queue Table
    db.run(`CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        customerName TEXT, 
        phone TEXT, 
        serviceNames TEXT, 
        totalDuration INTEGER
    )`);
    // Historical Table
    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        customerName TEXT, 
        phone TEXT, 
        services TEXT, 
        completedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// API Routes
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services", [], (err, rows) => res.json(rows));
});

app.post('/api/services', (req, res) => {
    const { name, duration } = req.body;
    db.run("INSERT INTO services (name, duration) VALUES (?, ?)", [name, duration], () => res.sendStatus(201));
});

app.delete('/api/services/:id', (req, res) => {
    db.run("DELETE FROM services WHERE id = ?", req.params.id, () => res.sendStatus(200));
});

app.get('/api/queue', (req, res) => {
    db.all("SELECT * FROM queue", [], (err, rows) => res.json(rows));
});

app.post('/api/queue', (req, res) => {
    const { customerName, phone, serviceNames, totalDuration } = req.body;
    db.run("INSERT INTO queue (customerName, phone, serviceNames, totalDuration) VALUES (?, ?, ?, ?)", 
        [customerName, phone, serviceNames, totalDuration], () => res.sendStatus(201));
});

app.post('/api/complete/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM queue WHERE id = ?", [id], (err, row) => {
        if (row) {
            db.run("INSERT INTO history (customerName, phone, services) VALUES (?, ?, ?)", 
                [row.customerName, row.phone, row.serviceNames]);
            db.run("DELETE FROM queue WHERE id = ?", [id], () => res.sendStatus(200));
        }
    });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));