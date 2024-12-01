# Mental Wellness Journal

This project is a **Mental Wellness Journal** built using **Vue.js** for the frontend, **Node.js/Express** for the backend, and **PostgreSQL** for the database. It helps users log their moods, visualize burnout levels, and receive actionable insights based on their journal entries.

---

## Features
- Log daily moods and notes.
- Analyze burnout trends with a graphical representation.
- Generate personalized burnout assessment reports.
- Import/export journal entries in JSON or CSV format.
- Secure backend with PostgreSQL database.

---

## Prerequisites
To run the project locally, ensure you have the following installed:
- **Node.js** (v14 or later)
- **npm** (v6 or later)
- **PostgreSQL** database
- **Git** (optional, to clone the repository)

---

## Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies
Here are the exact `npm` dependencies you need to install for both the frontend (Vue) and the backend (Node.js/Express):

### **Frontend Dependencies**
1. **`vue`**: The core Vue.js framework.
2. **`axios`**: For making HTTP requests.
3. **`chart.js`**: For rendering charts.
4. **`vue-chartjs`**: Vue wrapper for Chart.js.

Install these with:
```bash
npm install vue axios chart.js vue-chartjs
```

### **Backend Dependencies**
1. **`express`**: Web framework for Node.js.
2. **`body-parser`**: Middleware to parse incoming request bodies.
3. **`cors`**: Middleware to enable CORS (Cross-Origin Resource Sharing).
4. **`pg`**: PostgreSQL client for Node.js.

Install these with:
```bash
npm install express body-parser cors pg
```

---

#### 3. **Replace both instances of YOUR_API_KEY with your OpenAI key**
Change these lines (2 of them) specifically:
```js
headers: {
  Authorization: `Bearer YOUR_API_KEY`,
  "Content-Type": "application/json",
},
```

#### 4. **Run the Frontend**
```bash
npm run serve
```

#### 5. **Run the Backend**
```bash
node server.js
```
Or use `nodemon` for automatic restarts:
```bash
npx nodemon server.js
```

The backend will be available at `http://localhost:5050`.
The frontend will be available at `http://localhost:8080`.

---

## Technologies Used
- **Frontend**: Vue.js
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **API**: OpenAI GPT-4 for burnout analysis

---

## Contributing
Feel free to submit issues or pull requests. Contributions are welcome!
