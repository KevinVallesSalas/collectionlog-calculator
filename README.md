# Collection Log App

## Overview
The Collection Log App allows users to track their collection log progress, view completion times for various activities, and determine the fastest logs to complete based on their current progress.

## Features
- Upload your collection log manually via a JSON file or fetch it automatically via username.
- View your collection log and track obtained items.
- Calculate estimated time to complete missing log slots.
- Sort completion times by activity name or time to next log slot.
- Stores data locally for easy retrieval.

## Live Demo
You can access a live version of the Collection Log App at:
[https://collection-log-advisor.onrender.com](https://collection-log-advisor.onrender.com/)

## Updating Completion Rates
To update the completion rates used in the application:
1. Export the completion rates from the **Collection Log Advisor** spreadsheet found in the **Collection Log Discord**.
2. Save the exported data as a CSV file.
3. Run the `import_completion_rates` script to update the database with the new completion rates.
   ```sh
   python manage.py import_completion_rates path/to/completion_rates.csv
   ```
4. Restart the backend to apply the changes.

## Updating Collection Log Items
After a game update, run the following scripts to update new collection log items and refresh wiki images/links:
1. Generate new items and sections:
   ```sh
   python backend/manage.py generate_items
   ```
2. Update wiki images and links:
   ```sh
   python backend/manage.py fetch_item_images
   ```

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/KevinVallesSalas/collectionlog-calculator.git
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

## Running the Project with Docker
You can run the entire application using Docker. Follow these steps:

1. **Ensure Docker Desktop is Running:**
   - Make sure Docker Desktop is running on your machine.
   - If you're on Windows, ensure that Docker is set to use Linux containers.

2. **Build and Run Using Docker Compose:**
   - In the root directory of the repository, run:
     ```sh
     docker-compose up --build
     ```
   - This command builds the Docker images defined in your `docker-compose.yml` file and starts the containers.

3. **Access the Application:**
   - Once the containers are running, open your browser and navigate to:
     - The frontend at `http://localhost:3000`
     - The backend (if needed) at `http://localhost:8000`

## Live Demo
You can access a live version of the Collection Log App at: [https://collection-log-advisor.onrender.com/](https://collection-log-advisor.onrender.com/)

## Contributing
Feel free to submit issues or contribute to the project by creating pull requests!