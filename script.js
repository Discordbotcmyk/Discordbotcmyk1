document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const DURATION_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
    const LOCAL_STORAGE_KEY = 'apexCadMaintenanceEndTime';

    let endTime;

    // 1. Check local storage for a previously set end time
    const storedEndTime = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (storedEndTime) {
        // If an end time exists, use it
        endTime = new Date(parseInt(storedEndTime, 10));
    } else {
        // Otherwise, set a new end time (current time + 10 minutes)
        endTime = new Date().getTime() + DURATION_MS;
        localStorage.setItem(LOCAL_STORAGE_KEY, endTime);
    }

    // 2. Main countdown function
    function updateCountdown() {
        const now = new Date().getTime();
        const timeRemaining = endTime - now;

        if (timeRemaining <= 0) {
            // Timer has reached zero or passed
            clearInterval(timerInterval);
            countdownEl.textContent = "00:00";
            countdownEl.classList.add('completed');
            
            // Wait 5 seconds before enabling a refresh message/action
            setTimeout(() => {
                countdownEl.textContent = "Time's Up! Refresh Now.";
                // Clear the local storage key so a new timer starts next time
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }, 5000); // 5 seconds delay before the final message

            return;
        }

        // Calculate minutes and seconds
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        // Format and display the time (e.g., 09:05)
        const displayMinutes = String(minutes).padStart(2, '0');
        const displaySeconds = String(seconds).padStart(2, '0');

        countdownEl.textContent = `${displayMinutes}:${displaySeconds}`;
    }

    // 3. Start the interval to update the countdown every second
    const timerInterval = setInterval(updateCountdown, 1000);

    // Initial call to display the time immediately without waiting 1 second
    updateCountdown();
});
