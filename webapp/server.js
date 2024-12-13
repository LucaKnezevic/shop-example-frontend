const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./webshop.db', (error) => {
    if (error) {
        console.error(error.message);
    } else {
        console.log('Connected to the webshop database.');
    }
});

app.get('/api/products', (req, res) => {
    let { minPrice, maxPrice, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (minPrice) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }

    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }

    if (search) {
        query += ' AND name LIKE ?';
        params.push(`%${search}%`);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/products/max-price', (req, res) => {
    db.get('SELECT MAX(price) as maxPrice FROM products', (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ maxPrice: row.maxPrice || 100 });
    });
});

app.post('/api/products', (req, res) => {
    const { name, price, description } = req.body;

    if (!name || !price || !description) {
        return res.status(400).json({ error: 'Bitte alle Felder ausfüllen.' });
    }

    db.run('INSERT INTO products (name, price, description) VALUES (?, ?, ?)', [name, price, description], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Produkt erfolgreich hinzugefügt', id: this.lastID });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id);

    if (!idToDelete) {
        return res.status(400).json({ error: 'Ungültige Produkt-ID' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM products WHERE id = ?', [idToDelete], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
            }

            db.run('UPDATE products SET id = id - 1 WHERE id > ?', [idToDelete], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }

                db.run('UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM products) WHERE name = "products"', function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }

                    db.run('COMMIT', function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: err.message });
                        }
                        res.json({ message: 'Produkt gelöscht und IDs neu gesetzt' });
                    });
                });
            });
        });
    });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
