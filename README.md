# Collection Log App

## Overview
The Collection Log App allows users to track their collection log progress, view completion times for various activities, and determine the fastest logs to complete based on their current progress.

## Features
- Upload your collection log manually via a JSON file or fetch it automatically via username.
- View your collection log and track obtained items.
- Calculate estimated time to complete missing log slots.
- Sort completion times by activity name or time to next log slot.
- Stores data locally for easy retrieval.

## Updating Completion Rates
To update the completion rates used in the application:
1. Export the completion rates from the **Collection Log Advisor** spreadsheet found in the **Collection Log Discord**.
2. Save the exported data as a CSV file.
3. Run the `import_completion_rates` script to update the database with the new completion rates.
   ```sh
   python manage.py import_completion_rates path/to/completion_rates.csv
   ```
4. Restart the backend to apply the changes.

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/collectionlog-calculator.git
   ```
2. Navigate to the project directory:
   ```sh
   cd collectionlog-calculator
   ```
3. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   ```
   ```sh
   cd frontend && npm install
   ```

## Running the Project
1. Start the Django backend:
   ```sh
   cd backend
   python manage.py runserver
   ```
2. Start the frontend:
   ```sh
   cd frontend
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## Contributing
Feel free to submit issues or contribute to the project by creating pull requests!

