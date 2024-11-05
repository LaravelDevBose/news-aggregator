# News Aggregator Project

This project is a news aggregator that fetches data from various RSS feeds, processes it to extract topics and named entities, and stores it in a MongoDB database. It also provides endpoints to search and filter articles. This document provides all necessary information to set up, run, and understand the project’s core functionality.

---

## Table of Contents

1. [Docker Setup / Project Setup](#docker-setup-project-setup)
2. [Environment Variables](#environment-variables)
3. [How to Run This Project](#how-to-run-this-project)
4. [MongoDB Setup](#mongodb-setup)
5. [Error Logging and Logger](#error-logging-and-logger)
6. [Article Model Structure](#article-model-structure)
7. [API Endpoints](#api-endpoints)
8. [How the Scheduler Works](#how-the-scheduler-works)
9. [Fetching Data and Processing](#fetching-data-and-processing)
10. [Error Handling](#error-handling)
11. [Topic and Entity Extraction](#topic-and-entity-extraction)
12. [Data Storage, Search, and Filtering](#data-storage-search-and-filtering)

---

### 1. Docker Setup / Project Setup

This project is Dockerized to ensure easy setup and dependency management. Docker is used to set up the Node.js application and MongoDB instance.

#### Step 1: Install Docker and Docker Compose
- Make sure Docker and Docker Compose are installed on your machine. Refer to the [Docker installation guide](https://docs.docker.com/get-docker/) if needed.

#### Step 2: Docker Configuration
- The `docker-compose.yml` file defines two services:
    - `app`: The Node.js application.
    - `mongo`: The MongoDB database.

#### Step 3: Build and Run the Docker Containers
- Run the following commands to build and start the project in Docker:

  ```bash
  docker-compose build
  docker-compose up
  ```

- The application will start on `http://localhost:3000` (or another port specified in `.env`).

---

### 2. Environment Variables

The `.env` file is used to configure key settings and sensitive information. Below are the key environment variables:

| Variable               | Description                                         |
|------------------------|-----------------------------------------------------|
| `MONGO_URI`            | URI for MongoDB connection                          |
| `PORT`                 | Port for the application to listen on               |
| `FETCH_INTERVAL_MINUTES` | Interval in minutes for data fetching in scheduler |
| `LOG_LEVEL`            | Logging level for Winston (e.g., `info`, `error`)   |

Example `.env` file:

```env
MONGO_URI=mongodb://root:password@mongo:27017/news_aggregator?authSource=admin
PORT=3000
FETCH_INTERVAL_MINUTES=60
LOG_LEVEL=info
```

---

### 3. How to Run This Project

To run the project locally:
1. Make sure the `.env` file is properly configured.
2. Run Docker Compose to start the application:

   ```bash
   docker-compose up
   ```

This will start the server and MongoDB instance in the background.

---

### 4. MongoDB Setup

The MongoDB database is set up via Docker Compose. It’s configured with a persistent data volume to retain data across restarts.

- **Connection URI**: The MongoDB URI should be specified in the `.env` file.
- **Data Storage**: Data is stored in the `news_aggregator` database with a collection for articles.

To connect directly to MongoDB for testing or development, use:

```bash
docker-compose exec mongo mongo -u root -p password --authenticationDatabase admin
```

---

### 5. Error Logging and Logger

Error logging is managed using **Winston**, which logs to both the console and a file (`logs/app.log`).

- **Log Levels**: Configurable via the `LOG_LEVEL` environment variable.
- **Error Handling**: Errors are logged using custom functions (`handleErrorWithLog`), allowing error messages to be logged with contextual details.

---

### 6. Article Model Structure

The Article model represents articles fetched from RSS feeds. Here’s the structure of the model:

| Field         | Type      | Description                                   |
|---------------|-----------|-----------------------------------------------|
| `guid`        | `String`  | Unique identifier for each article (indexed)  |
| `title`       | `String`  | Title of the article                          |
| `description` | `String`  | Brief description or summary                  |
| `pubDate`     | `Date`    | Publication date of the article (indexed)     |
| `sourceUrl`   | `String`  | URL to the original article                   |
| `topics`      | `[String]`| Topics extracted from the article (indexed)   |
| `entities`    | `[String]`| Named entities like people, places (indexed)  |
| `author`      | `String`  | Author’s name (if available)                  |

---

### 7. API Endpoints

The project exposes the following endpoints:

- **Root Endpoint**: `GET /`
    - Returns a welcome message indicating the service is running.

- **Fetch Articles Endpoint**: `GET /fetch-articles`
    - Triggers a manual fetch of articles from configured RSS feeds.
    - Returns the fetched articles.

- **Search Articles Endpoint**: `GET /search-articles`
    - Allows searching articles based on title, pubDate, topics, and entities.
    - Query parameters:
        - `title`: Partial title search.
        - `startDate` and `endDate`: Date range for publication date.
        - `topics`: Filter by topics.
        - `entities`: Filter by entities.
        - `page` and `limit`: Pagination controls.
```shell
# Manual Fetch Content
curl --location 'http://localhost:3000/fetch-articles'
```
```shell
# Search & Filter Content
curl --location 'http://localhost:3000/search-articles?title=null&startDate=null&endDate=null&entities=NFTs&topics=online&page=1&limit=10'
```
---

### 8. How the Scheduler Works

The scheduler, implemented with `node-schedule`, triggers automatic data fetching based on the `FETCH_INTERVAL_MINUTES` environment variable.

- **Interval Configuration**: Set in `.env` as `FETCH_INTERVAL_MINUTES`.
- **Start Time**: The scheduler starts after the server initializes, fetching articles at the defined interval.

---

### 9. Fetching Data and Processing

Data fetching is handled by the `fetchArticles` function. It:
1. Fetches RSS feeds from the URLs in the configuration.
2. Parses each article and extracts relevant data fields.
3. Processes articles for topics and named entities.

Each fetched article is then prepared for storage, with additional processing for topics and entities.

---

### 10. Error Handling

Error handling is implemented to capture and log errors at each stage:
- **Invalid URLs**: Checked and logged with specific messages.
- **Network Issues**: Handled with error-specific logging (e.g., timeout or DNS errors).
- **Data Fetch Errors**: Each fetch attempt has error handling to log failures without halting the entire process.

`handleErrorWithLog` is a utility function that logs errors with structured details, helping to identify issues in the pipeline.

---

### Topic and Entity Extraction Details

The `extractTopics` and `extractEntities` functions are key components in this project, responsible for processing article content to identify and extract relevant topics and named entities. These extracted elements enrich the article metadata, allowing for improved search, filtering, and overall categorization of news content. Here’s a detailed breakdown of how each function works, the models and libraries used, and the logic behind the extraction process.

---

#### 1. Topic Extraction with `extractTopics`

**Objective**: To identify and extract the most relevant topics from the article text, helping to understand the main subjects discussed in each piece of content.

**Model/Library**: `compromise`, a JavaScript natural language processing (NLP) library.

**Process**:
- **POS Matching**: The function first processes the article text with `compromise`, specifically identifying nouns, verbs, and adjectives. These parts of speech are typically the most informative in understanding the content's primary themes, as nouns often represent main subjects, verbs signify actions, and adjectives provide descriptive context.
- **Topic Cleaning**: Each identified term undergoes a cleaning step to remove any special characters or punctuation. This normalization ensures consistency, eliminating extraneous characters that could distort the analysis.
- **Filtering and Transformation**: Terms shorter than 5 characters are discarded, as they’re often less informative or may consist of common filler words. Remaining terms are then converted to lowercase, ensuring uniformity in text processing.
- **Frequency Calculation**: A frequency count of the remaining terms is then calculated. Higher frequency terms are presumed to be the central topics, as they appear multiple times within the content.
- **Top 100 Topics**: The top 100 most frequent terms are selected as topics, representing a summary of the most relevant terms in the text.

**Purpose of Topics Extraction**:
This process yields a concise list of topics that capture the primary subjects discussed in each article. By focusing on high-frequency terms, the extraction captures topics that likely play a significant role in the content, making the final list useful for categorizing and filtering articles by their core themes.

---

#### 2. Named Entity Extraction with `extractEntities`

**Objective**: To identify and extract specific named entities (such as people, locations, and organizations) from the article text. This enables filtering by entities and provides contextual metadata for each article.

**Model/Library**: `compromise` is also used here to process the text and recognize named entities.

**Process**:
- **Entity Recognition**: The function processes the text through `compromise`'s built-in methods to identify and separate three main categories of named entities:
    - **People**: Recognizes names of individuals mentioned in the article.
    - **Locations**: Identifies geographic locations, such as cities, countries, and landmarks.
    - **Organizations**: Detects names of institutions, businesses, or organizations.
- **Entity Cleaning**: Each extracted entity is stripped of any special characters or extraneous symbols. This ensures that entity names are clean and ready for use in filtering or display.
- **Output Formatting**: The function then consolidates the extracted people, locations, and organizations into a single array of entity names, allowing the metadata to be stored with the article and used for downstream tasks like filtering.

**Purpose of Entity Extraction**:
This function enriches articles by tagging them with key entities, enabling users to search by people, places, or organizations. Named entities help provide additional context for each article, making it easier for end-users to find articles based on relevant figures, locations, or institutions discussed within the content.

---

### Models and Libraries Used

Both functions rely on `compromise`, an efficient NLP library for JavaScript that provides language processing capabilities without requiring external servers or complex machine learning models. `compromise` offers methods for POS tagging and entity recognition directly within JavaScript, making it ideal for web applications that require moderate NLP functionality without external dependencies.

Using `compromise` enables:
- **Direct integration** with Node.js for a seamless setup.
- **Part-of-speech tagging** to classify terms by nouns, verbs, and adjectives.
- **Entity recognition** for key names, places, and organizations in the text.

While `compromise` may not offer the depth of NLP libraries like spaCy or OpenAI’s advanced models, it provides a lightweight and efficient solution suitable for this project’s scope, delivering relevant and reliable topic and entity extraction with minimal setup.

---

### Summary of Extraction Process

- **Topics Extraction**:
    - Focuses on nouns, verbs, and adjectives to capture key themes.
    - Uses frequency analysis to prioritize and select the top 100 most relevant terms.
- **Entities Extraction**:
    - Identifies people, locations, and organizations to tag articles with contextual metadata.
    - Cleans and formats entities to ensure accurate and meaningful tagging.

  By capturing these topics and entities, the project enhances search and filtering capabilities, enabling users to easily access articles that match their interests or focus on specific subjects.
---

### 12. Data Storage, Search, and Filtering

Fetched articles are stored in MongoDB. The `searchArticles` function enables efficient search and filtering by:
1. **Indexed Fields**: Indexes on frequently searched fields (title, pubDate, topics, entities).
2. **Efficient Querying**: Uses MongoDB’s `$or` operator to match articles based on any filter, with pagination for efficient data handling.
3. **Pagination**: Controls result size, reducing memory load.

This ensures that search operations are fast and resource-efficient, even with a large dataset.



 **_**Note: For Making this document i am taking help from chatGPT**_**
