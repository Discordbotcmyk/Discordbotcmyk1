body {
    font-family: sans-serif;
    background-color: #f4f4f9;
    color: #333;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    text-align: center;
}

.container {
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 90%;
}

.timer {
    font-size: 3em;
    font-weight: bold;
    color: #d9534f; /* A strong color for the timer */
    margin-bottom: 20px;
    padding: 10px;
    border: 2px solid #d9534f;
    border-radius: 5px;
    display: inline-block;
}

.main-title {
    font-size: 2.5em;
    color: #5cb85c; /* A green for positive messaging */
    margin-bottom: 10px;
}

.subtitle {
    font-size: 1.5em;
    color: #555;
    margin-bottom: 20px;
}

.message {
    font-size: 1em;
    line-height: 1.5;
    color: #666;
}

/* Optional: Style for when the timer hits zero */
.timer.completed {
    color: #337ab7;
    border-color: #337ab7;
}
