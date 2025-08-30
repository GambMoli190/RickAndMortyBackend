# Rick and Morty API

A GraphQL and REST API built with Node.js, TypeScript, Express, and PostgreSQL that provides data about characters, locations, origins, and episodes from the Rick and Morty series.

## Prerequisites

- Node.js v18 or higher
- PostgreSQL v13 or higher
- Redis v6 or higher
- npm or yarn package manager

## Installation and Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd rick-and-morty-api
```

2. Install dependencies:
```bash
npm install
```

3. Environment Configuration:
Copy and paste the `.env` file sent by email to the root directory of the project. The file contains all necessary environment variables including database credentials, Redis configuration, and API settings.

4. Database Setup:
```bash
# Create database
createdb rickandmorty
```

## Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:4000`

### Production Mode
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## API Endpoints

### REST Endpoints

#### Health Check
```
GET /health
```

#### Database Statistics
```
GET /db-stats
```

#### Manual Character Update
```
POST /update-characters
```

### GraphQL Endpoint

```
POST /graphql
```

#### Available Queries

##### Get All Characters (with filters)
```graphql
query GetCharacters($filters: CharacterFilters) {
  characters(filters: $filters) {
    id
    name
    status
    species
    gender
    origin {
      name
      url
    }
    location {
      name
      url
    }
    image
  }
}
```

**Filters:** name, status, species, gender, origin

##### Get Single Character
```graphql
query GetCharacter($id: Int!) {
  character(id: $id) {
    id
    name
    status
    species
    image
  }
}
```

##### Get First 15 Characters
```graphql
query {
  first15Characters {
    id
    name
    status
    species
    image
  }
}
```

##### Get Character Count
```graphql
query GetCharacterCount($filters: CharacterFilters) {
  characterCount(filters: $filters)
}
```

##### Basic Status
```graphql
query {
  hello
  status
}
```

## GraphQL Schema Types

```graphql
type Character {
  id: Int!
  name: String!
  status: String!
  species: String!
  type: String
  gender: String!
  origin: Origin!
  location: Location!
  image: String!
  episode: [String!]!
  url: String!
  created: String!
}

input CharacterFilters {
  name: String
  status: String
  species: String
  gender: String
  origin: String
}
```