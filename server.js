const { google } = require('googleapis');
const credentials = require('./credentials.json');

// Google Sheets Configuration
const SPREADSHEET_ID = '1nC2Nz_pFctKrKmLvJLWDT7yL9FjJVOKDMvOykLU_C1s'; // Found in the URL of your sheet

async function appendToSheet(data) {
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const row = [
        new Date().toLocaleString(), 
        data.customerName, 
        data.phone, 
        data.serviceNames, 
        data.totalDuration
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Completed!A:E',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [row] },
    });
}

// Update your existing /api/complete route to include this:
app.post('/api/complete/:id', async (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM queue WHERE id = ?", [id], async (err, row) => {
        if (row) {
            try {
                // 1. Save to Google Sheets
                await appendToSheet(row);
                
                // 2. Remove from local active queue
                db.run("DELETE FROM queue WHERE id = ?", [id], () => res.sendStatus(200));
            } catch (error) {
                console.error("Sheet Error:", error);
                res.status(500).send("Failed to save to Google Sheets");
            }
        }
    });
});