/*require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Ensure this connects to your MySQL database
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Root route: Redirect to the requirements list
app.get('/', (req, res) => {
    res.redirect('/requirements');
});

// Route to display all requirements with dropdowns for compliance status
app.get('/requirements', (req, res) => {
    const query = "SELECT * FROM requirements ORDER BY requirement_id";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error retrieving requirements:", err);
            return res.status(500).send("Error retrieving requirements.");
        }
        res.render('requirements', { requirements: results });
    });
});

// Route to save compliance statuses from the requirements page
app.post('/submit-requirements-status', (req, res) => {
    const userId = 1; // Example user ID
    const complianceStatuses = req.body.compliance;

    // Filter out invalid requirement IDs (like 0)
    const statusEntries = Object.entries(complianceStatuses)
        .filter(([requirementId, status]) => parseInt(requirementId, 10) > 0) // Ensure requirementId is valid
        .map(([requirementId, status]) => [
            userId,
            parseInt(requirementId, 10),
            status,
        ]);

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [statusEntries], (err) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/calculate-score');
    });
});

// Route to calculate and display the compliance score based on statuses
app.get('/calculate-score', (req, res) => {
    const userId = 1; // Example user ID

    const query = `
        SELECT compliance_status
        FROM compliance_statuses
        WHERE user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error retrieving compliance statuses:", err);
            return res.status(500).send("Error calculating requirement scores.");
        }

        let compliantCount = 0;
        let applicableCount = 0;

        results.forEach(row => {
            if (row.compliance_status !== 'N/A') {
                applicableCount++;
                if (row.compliance_status === 'Compliant') {
                    compliantCount++;
                }
            }
        });

        const complianceScore = applicableCount > 0 ? (compliantCount / applicableCount) * 100 : 0;
        res.render('final-score', { finalScore: complianceScore.toFixed(2) }); // Pass as finalScore
    });
});

// Route to display detailed questions for a requirement
app.get('/requirements/:id', (req, res) => {
    const requirementId = parseInt(req.params.id, 10);

    const query = `
        SELECT r.requirement_id, r.name AS requirement_name, r.description, q.question_id, q.text AS question_text
        FROM requirements r
        LEFT JOIN questions q ON r.requirement_id = q.requirement_id
        WHERE r.requirement_id = ?
        ORDER BY q.question_id
    `;

    db.query(query, [requirementId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error retrieving the requirement.");
        }

        if (results.length === 0) {
            return res.status(404).send("Requirement not found.");
        }

        const requirement = {
            id: requirementId,
            name: results[0].requirement_name,
            description: results[0].description,
            questions: results.map(row => ({
                question_id: row.question_id,
                text: row.question_text
            }))
        };

        const previousId = requirementId > 1 ? requirementId - 1 : null;
        const nextId = requirementId < 12 ? requirementId + 1 : null;
        res.render('requirement', { requirement, previousId, nextId });
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});*/


/*require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Ensure this connects to your MySQL database
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Root route: Redirect to the requirements list
app.get('/', (req, res) => {
    res.redirect('/requirements');
});

// Route to display all requirements with dropdown for compliance status
app.get('/requirements', (req, res) => {
    const query = "SELECT * FROM requirements ORDER BY requirement_id";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error retrieving requirements:", err);
            return res.status(500).send("Error retrieving requirements.");
        }
        res.render('requirements', { requirements: results });
    });
});

// Route to handle compliance status submission
app.post('/submit-compliance', (req, res) => {
    const userId = 1; // Example user ID
    const complianceStatuses = req.body.compliance;

    const statusEntries = Object.entries(complianceStatuses)
        .map(([requirementId, status]) => [userId, parseInt(requirementId, 10), status]);

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [statusEntries], (err, results) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/requirement-score');
    });
});

// Route to calculate and display the compliance score
app.get('/requirement-score', (req, res) => {
    const userId = 1;

    const scoreQuery = `
        SELECT compliance_status,
               COUNT(CASE WHEN compliance_status = 'Compliant' THEN 1 END) AS compliantCount,
               COUNT(CASE WHEN compliance_status = 'Non-Compliant' THEN 1 END) AS nonCompliantCount,
               COUNT(CASE WHEN compliance_status = 'N/A' THEN 1 END) AS naCount
        FROM compliance_statuses
        WHERE user_id = ?
    `;

    db.query(scoreQuery, [userId], (err, results) => {
        if (err) {
            console.error("Error calculating compliance score:", err);
            return res.status(500).send("Error calculating compliance score.");
        }

        const { compliantCount, nonCompliantCount, naCount } = results[0];
        const totalRequirements = compliantCount + nonCompliantCount + naCount;
        const complianceScore = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0;

        res.render('final-score', {
            complianceScore: complianceScore.toFixed(2),
            compliantCount,
            nonCompliantCount,
            naCount
        });
    });
});

// Route to display detailed questions for a requirement
app.get('/requirements/:id', (req, res) => {
    const requirementId = parseInt(req.params.id);

    const query = `
        SELECT r.requirement_id, r.name AS requirement_name, r.description, q.question_id, q.text AS question_text
        FROM requirements r
        LEFT JOIN questions q ON r.requirement_id = q.requirement_id
        WHERE r.requirement_id = ?
        ORDER BY q.question_id
    `;

    db.query(query, [requirementId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error retrieving the requirement.");
        }

        if (results.length === 0) {
            return res.status(404).send("Requirement not found.");
        }

        const requirement = {
            id: requirementId,
            name: results[0].requirement_name,
            description: results[0].description,
            questions: results.map(row => ({
                question_id: row.question_id,
                text: row.question_text
            }))
        };

        res.render('requirement', { requirement });
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});*/


/*require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Ensure this connects to your MySQL database
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Root route: Redirect to the requirements list
app.get('/', (req, res) => {
    res.redirect('/requirements');
});

// Route to display all requirements
app.get('/requirements', (req, res) => {
    const query = "SELECT * FROM requirements ORDER BY requirement_id";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error retrieving requirements:", err);
            return res.status(500).send("Error retrieving requirements.");
        }
        res.render('requirements', { requirements: results });
    });
});

// Route to display detailed questions for a requirement
app.get('/requirements/:id', (req, res) => {
    const requirementId = parseInt(req.params.id);

    const query = `
        SELECT r.requirement_id, r.name AS requirement_name, r.description, q.question_id, q.text AS question_text
        FROM requirements r
        LEFT JOIN questions q ON r.requirement_id = q.requirement_id
        WHERE r.requirement_id = ?
        ORDER BY q.question_id
    `;

    db.query(query, [requirementId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error retrieving the requirement.");
        }

        if (results.length === 0) {
            console.warn("No requirement found for ID:", requirementId);
            return res.status(404).send("Requirement not found.");
        }

        const requirement = {
            id: requirementId,
            name: results[0].requirement_name,
            description: results[0].description,
            questions: results.map(row => ({
                question_id: row.question_id,
                text: row.question_text
            }))
        };

        const previousId = requirementId > 1 ? requirementId - 1 : null;
        const nextId = requirementId < 12 ? requirementId + 1 : null;
        res.render('requirement', { requirement, previousId, nextId });
    });
});

// Route to handle compliance status submission
app.post('/submit-compliance-status', (req, res) => {
    const userId = 1; // Static user ID for testing
    const complianceStatuses = req.body.compliance || {};

    const complianceEntries = Object.entries(complianceStatuses).map(([requirementId, status]) => [
        userId, parseInt(requirementId, 10), status
    ]);

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status)
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [complianceEntries], (err, results) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/requirement-score');
    });
});


// Route to calculate and display the score
app.get('/requirement-score', (req, res) => {
    const userId = 1;

    const query = `
        SELECT compliance_status, COUNT(*) AS count
        FROM compliance_statuses
        WHERE user_id = ?
        GROUP BY compliance_status
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error calculating compliance score:", err);
            return res.status(500).send("Error calculating compliance score.");
        }

        // Calculate score based on statuses
        let compliantCount = 0, nonCompliantCount = 0, naCount = 0;

        results.forEach(row => {
            if (row.compliance_status === 'Compliant') {
                compliantCount = row.count;
            } else if (row.compliance_status === 'Non-Compliant') {
                nonCompliantCount = row.count;
            } else if (row.compliance_status === 'N/A') {
                naCount = row.count;
            }
        });

        const totalRequirements = compliantCount + nonCompliantCount + naCount;
        const complianceScore = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0;

        res.render('final-score', {
            finalScore: complianceScore.toFixed(2),
            compliantCount,
            nonCompliantCount,
            naCount
        });
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});*/


/*require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Ensure this connects to your MySQL database
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Root route: Redirect to the requirements list
app.get('/', (req, res) => {
    res.redirect('/requirements');
});

// Route to display all requirements
app.get('/requirements', (req, res) => {
    const query = "SELECT * FROM requirements ORDER BY requirement_id";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error retrieving requirements:", err);
            return res.status(500).send("Error retrieving requirements.");
        }
        res.render('requirements', { requirements: results });
    });
});

// Route to display detailed questions for a requirement
app.get('/requirements/:id', (req, res) => {
    const requirementId = parseInt(req.params.id);

    const query = `
        SELECT r.requirement_id, r.name AS requirement_name, r.description, q.question_id, q.text AS question_text
        FROM requirements r
        LEFT JOIN questions q ON r.requirement_id = q.requirement_id
        WHERE r.requirement_id = ?
        ORDER BY q.question_id
    `;

    db.query(query, [requirementId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error retrieving the requirement.");
        }

        if (results.length === 0) {
            console.warn("No requirement found for ID:", requirementId);
            return res.status(404).send("Requirement not found.");
        }

        const requirement = {
            id: requirementId,
            name: results[0].requirement_name,
            description: results[0].description,
            questions: results.map(row => ({
                question_id: row.question_id,
                text: row.question_text
            }))
        };

        const previousId = requirementId > 1 ? requirementId - 1 : null;
        const nextId = requirementId < 12 ? requirementId + 1 : null;
        res.render('requirement', { requirement, previousId, nextId });
    });
});

// Route to handle compliance status submission
app.post('/submit-compliance-status', (req, res) => {
    const userId = 1; // Static user ID for testing
    const complianceStatuses = req.body.compliance || {};

    // Prepare data for insertion and filter out invalid requirement_ids
    const complianceEntries = Object.entries(complianceStatuses)
        .map(([requirementId, status]) => [userId, parseInt(requirementId, 10), status])
        .filter(entry => entry[1] > 0); // Filter out any requirement_id that is 0 or invalid

    console.log("Filtered Compliance Entries to be inserted:", complianceEntries);

    if (complianceEntries.length === 0) {
        console.error("No valid compliance statuses provided.");
        return res.status(400).send("No valid compliance statuses provided.");
    }

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status)
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [complianceEntries], (err, results) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/requirement-score');
    });
});

// Route to calculate and display the score
app.get('/requirement-score', (req, res) => {
    const userId = 1;

    const query = `
        SELECT compliance_status, COUNT(*) AS count
        FROM compliance_statuses
        WHERE user_id = ?
        GROUP BY compliance_status
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error calculating compliance score:", err);
            return res.status(500).send("Error calculating compliance score.");
        }

        // Calculate score based on statuses
        let compliantCount = 0, nonCompliantCount = 0, naCount = 0;

        results.forEach(row => {
            if (row.compliance_status === 'Compliant') {
                compliantCount = row.count;
            } else if (row.compliance_status === 'Non-Compliant') {
                nonCompliantCount = row.count;
            } else if (row.compliance_status === 'N/A') {
                naCount = row.count;
            }
        });

        const totalRequirements = compliantCount + nonCompliantCount + naCount;
        const complianceScore = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0;

        res.render('final-score', {
            finalScore: complianceScore.toFixed(2),
            compliantCount,
            nonCompliantCount,
            naCount
        });
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});*/


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db'); // Ensure this connects to your MySQL database
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Root route: Redirect to the requirements list
app.get('/', (req, res) => {
    res.redirect('/requirements');
});

// Route to display all requirements
app.get('/requirements', (req, res) => {
    const query = "SELECT * FROM requirements ORDER BY requirement_id";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error retrieving requirements:", err);
            return res.status(500).send("Error retrieving requirements.");
        }
        res.render('requirements', { requirements: results });
    });
});

// Route to display detailed questions for a requirement
app.get('/requirements/:id', (req, res) => {
    const requirementId = parseInt(req.params.id);

    const query = `
        SELECT r.requirement_id, r.name AS requirement_name, r.description, q.question_id, q.text AS question_text
        FROM requirements r
        LEFT JOIN questions q ON r.requirement_id = q.requirement_id
        WHERE r.requirement_id = ?
        ORDER BY q.question_id
    `;

    db.query(query, [requirementId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error retrieving the requirement.");
        }

        if (results.length === 0) {
            console.warn("No requirement found for ID:", requirementId);
            return res.status(404).send("Requirement not found.");
        }

        const requirement = {
            id: requirementId,
            name: results[0].requirement_name,
            description: results[0].description,
            questions: results.map(row => ({
                question_id: row.question_id,
                text: row.question_text
            }))
        };

        const previousId = requirementId > 1 ? requirementId - 1 : null;
        const nextId = requirementId < 12 ? requirementId + 1 : null;
        res.render('requirement', { requirement, previousId, nextId });
    });
});

// Route to handle compliance status submission
/*app.post('/submit-compliance-status', (req, res) => {
    const userId = 1; // Static user ID for testing
    const complianceStatuses = req.body.compliance || {};
    console.log(complianceStatuses.length,"complaince status len");
    // Prepare data for insertion and ensure all valid entries are included
    const complianceEntries = Object.entries(complianceStatuses)
        .map(([requirementId, status]) => [userId, parseInt(requirementId, 10), status])
        .filter(entry => entry[1] >= 1 && entry[1] <= 12); // Only include valid requirement IDs (1-12)
    //console.log(requirementId)
    console.log("Compliance Entries to be inserted:", complianceEntries.len);

    if (complianceEntries.length === 0) {
        console.error("No valid compliance statuses provided.");
        return res.status(400).send("No valid compliance statuses provided.");
    }

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status)
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [complianceEntries], (err, results) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/requirement-score');
    });
});*/


app.post('/submit-compliance-status', (req, res) => {
    const userId = 1; // Static user ID for testing
    const complianceStatuses = req.body.compliance || {};

    console.log("Compliance Statuses Object:", complianceStatuses);
    console.log("Compliance Statuses Count:", Object.keys(complianceStatuses).length);

    // Map each entry without changing the requirementId and include IDs from 0 to 11
    const complianceEntries = Object.entries(complianceStatuses)
        .map(([requirementId, status]) => {
            const parsedRequirementId = parseInt(requirementId, 10)+1;
            console.log(`Parsed Requirement ID: ${parsedRequirementId}, Status: ${status}`);
            return [userId, parsedRequirementId, status];
        })
        .filter(entry => entry[1] >= 1 && entry[1] <= 12); // Adjust to include IDs from 1 to 12

    console.log("Compliance Entries to be inserted (filtered):", complianceEntries);
    console.log("Compliance Entries Count (after filtering):", complianceEntries.length);

    if (complianceEntries.length === 0) {
        console.error("No valid compliance statuses provided.");
        return res.status(400).send("No valid compliance statuses provided.");
    }

    const query = `
        INSERT INTO compliance_statuses (user_id, requirement_id, compliance_status)
        VALUES ? 
        ON DUPLICATE KEY UPDATE compliance_status = VALUES(compliance_status)
    `;

    db.query(query, [complianceEntries], (err, results) => {
        if (err) {
            console.error("Error saving compliance statuses:", err);
            return res.status(500).send("Error saving compliance statuses.");
        }
        res.redirect('/requirement-score');
    });
});



// Route to calculate and display the score
app.get('/requirement-score', (req, res) => {
    const userId = 1;

    const query = `
        SELECT compliance_status, COUNT(*) AS count
        FROM compliance_statuses
        WHERE user_id = ?
        GROUP BY compliance_status
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error calculating compliance score:", err);
            return res.status(500).send("Error calculating compliance score.");
        }

        // Initialize counts and ensure all statuses are covered
        let compliantCount = 0, nonCompliantCount = 0, naCount = 0;

        results.forEach(row => {
            if (row.compliance_status === 'Compliant') {
                compliantCount = row.count;
            } else if (row.compliance_status === 'Non-Compliant') {
                nonCompliantCount = row.count;
            } else if (row.compliance_status === 'N/A') {
                naCount = row.count;
            }
        });

        const totalRequirements = 12; // Set total requirements to 12 for consistent scoring
        const complianceScore = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0;

        res.render('final-score', {
            finalScore: complianceScore.toFixed(2),
            compliantCount,
            nonCompliantCount,
            naCount
        });
    });
});



app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

