# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the backend code into the container
COPY . .

# Expose the port specified by the environment variable
EXPOSE ${PORT}

# Run Gunicorn as the WSGI server
CMD ["gunicorn", "collection_log_backend.wsgi:application", "--bind", "0.0.0.0:${PORT}"]
