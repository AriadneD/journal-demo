<template>
  <div id="app">
    <h1>Mental Wellness Journal</h1>
    <p>This is a demo of a mental health journal project built using Vue and PostgreSQL to demonstrate how machine learning can be used to process journal entries and identify mental health risks, such as burnout, generate a visualization of the user's burnout level over time, and suggest tailored interventions for user wellbeing. Built by Ari.</p>

    <div class="burnout-graph-section">
      <h2>Your Burnout Over Time</h2>
      <line-chart
        v-if="chartData && chartData.labels && chartData.datasets"
        :chart-data="chartData"
        :chart-options="chartOptions"
      />
      <p v-else>Loading burnout levels... (Please be patient, this may take a minute)</p>
      <button @click="fetchBurnoutLevels" :disabled="loadingBurnout">
        {{ loadingBurnout ? "Loading Burnout Levels..." : "Refresh Burnout Levels" }}
      </button>
    </div>



    <div class="vibe-section">
      <h2>Understand Your Current Vibe</h2>
      <div v-if="burnoutReport" v-html="burnoutReport"></div><br/>
      <button @click="refreshBurnoutReport" :disabled="loadingReport">
        {{ loadingReport ? "Loading Report..." : "Refresh Report" }}
      </button>
    </div>

    <div class="mood-form">
      <h2>Log Your Mood</h2>
      <input v-model="mood" class="form-input" placeholder="Mood (e.g., Happy, Stressed)" />
      <textarea v-model="notes" class="form-textarea" placeholder="Notes (optional)"></textarea>
      <input v-model="date" class="form-input" type="date" />
      <button class="form-button" @click="addMood">Add Mood</button>
    </div>

    <div class="import-section">
      <p>If you have a lot of journal entries to import at once, use our mass import. Upload a .CSV or .JSON file with the mood, notes, and date. Download either of our templates to get started.</p>
      <button @click="downloadJSONTemplate">Download JSON Template</button>
      <button @click="downloadCSVTemplate">Download CSV Template</button>
      <h2>Import Entries</h2>
      <input type="file" @change="importEntries" accept=".json, .csv" />
    </div>

    <div class="mood-list">
      <h2>Previous Moods</h2>
      <div v-for="entry in moodLogs" :key="entry.id" class="mood-entry">
        <p><strong>Date:</strong> {{ formatDate(entry.date) }}</p>
        <p><strong>Mood:</strong> {{ entry.mood }}</p>
        <p><strong>Notes:</strong> {{ entry.notes }}</p>
        
        <div v-if="editingId === entry.id" class="edit-form">
          <input v-model="editMood" class="edit-input" placeholder="Edit Mood" />
          <textarea v-model="editNotes" class="edit-textarea" placeholder="Edit Notes"></textarea>
          <input v-model="editDate" class="edit-input" type="date" />
          <div class="edit-buttons">
            <button class="edit-button save" @click="updateMood(entry.id)">Save</button>
            <button class="edit-button cancel" @click="cancelEdit">Cancel</button>
          </div>
        </div>

        <button v-if="editingId !== entry.id" class="form-button" @click="startEdit(entry)">Edit</button>
        <button class="form-button delete" @click="deleteMood(entry.id)">Delete</button>
        <hr />
      </div>
    </div>
  </div>
</template>


<script>
import axios from "axios";
import LineChart from "./components/LineChart.vue";

export default {
  components: { LineChart },
  data() {
    return {
      mood: "",
      notes: "",
      date: "",
      moodLogs: [],
      burnoutReport: "Loading your burnout assessment...",
      burnoutData: [],
      editingId: null,
      editMood: "",
      editNotes: "",
      editDate: "",
      loadingBurnout: false, 
      loadingReport: false,
    };
  },
  computed: {
    chartData() {
      // Ensure burnoutData exists and has entries
      if (!this.burnoutData || this.burnoutData.length === 0) {
        console.warn("No burnout data available for chart.");
        return null; // Prevent errors if data is missing
      }

      // Reverse the burnoutData to display in chronological order
      const reversedBurnoutData = [...this.burnoutData].reverse(); // Clone and reverse the data

      // Build chart data
      const data = {
        labels: reversedBurnoutData.map((entry) => this.formatDate(entry.date)), // Format dates
        datasets: [
          {
            label: "Burnout Level",
            data: reversedBurnoutData.map((entry) => entry.level), // Use burnout levels
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            tension: 0.4,
          },
        ],
      };

      console.log("Chart Data Prepared (Chronological):", data);
      return data;
    },

    chartOptions() {
      return {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: {
            title: { display: true, text: "Burnout Level" },
            min: 0,
            max: 10,
          },
        },
      };
    },
  },

  methods: {
    async addMood() {
      if (!this.mood || !this.date) {
        alert("Mood and Date are required");
        return;
      }
      try {
        await axios.post("http://localhost:5050/add-mood", {
          mood: this.mood,
          notes: this.notes,
          date: this.date,
        });
        this.mood = "";
        this.notes = "";
        this.date = "";
        this.fetchMoods();
      } catch (err) {
        console.error(err);
        alert("Error adding mood");
      }
    },
    async fetchMoods() {
      try {
        const response = await axios.get("http://localhost:5050/moods");
        this.moodLogs = response.data;
        this.fetchBurnoutLevels();
        this.refreshBurnoutReport();
      } catch (err) {
        console.error(err);
        alert("Error fetching moods");
      }
    },
    async fetchBurnoutLevels() {
      this.loadingBurnout = true;
      try {
        const journalEntries = this.moodLogs.map((entry) => ({
          mood: entry.mood,
          notes: entry.notes,
          date: entry.date,
        }));

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `
                  You are an empathetic psychologist tasked with assessing burnout levels from journal entries. For each entry, assign a burnout level (scale 0-10) and provide reasons for the rating. Return the result as a JSON array in this format:
                  [
                    {"date": "YYYY-MM-DD", "level": X, "reason": "Burnout reason"}
                  ]
                `,
              },
              {
                role: "user",
                content: `Here are my journal entries: ${JSON.stringify(journalEntries)}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer YOUR_API_KEY`,
              "Content-Type": "application/json",
            },
          }
        );

        // Log the raw response for debugging
        console.log("API Response:", response.data);

        const burnoutAnalysis = JSON.parse(response.data.choices[0].message.content);

        // Log the parsed data
        console.log("Parsed Burnout Analysis:", burnoutAnalysis);

        if (Array.isArray(burnoutAnalysis)) {
          this.burnoutData = burnoutAnalysis;
        } else {
          console.warn("Invalid format received from API:", burnoutAnalysis);
          this.burnoutData = [];
        }

        console.log("Final Burnout Data:", this.burnoutData);
      } catch (err) {
        console.error("Failed to fetch burnout levels:", err);
        this.burnoutData = [];
      } finally {
        this.loadingBurnout = false; // Set loading state to false
      }
    },
    async refreshBurnoutReport() {
      this.loadingReport = true;
      try {
        const journalEntries = this.moodLogs.map((entry) => ({
          mood: entry.mood,
          notes: entry.notes,
          date: entry.date
        }));
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                `
                You are an empathetic psychologist with a deep understanding of burnout and human behavior. Your task is to assess burnout and provide a detailed, personalized report based on the person's journal entries. Use their writing to demonstrate an understanding of their unique experiences, challenges, and personality. The report must feel tailored to their life and include creative, actionable advice that avoids generic suggestions. Use emojis throughout the report. Note relevant journal entry dates and cite when relevant.

                Your response should be formatted in HTML with the following structure:

                Overall Burnout Assessment: Use a bold <h2> heading for this section. Provide a brief overview of their burnout level (e.g., "Your burnout level is 8/10") and key contributing factors. Reference specific details from their journal entries.

                Patterns and Insights: Use a bold <h2> heading. Include bullet points (<ul>) for recurring themes, emotional patterns, and root causes of burnout. Use examples from their journal to make this section specific.

                Character Traits: Use a bold <h2> heading. Highlight their strengths and areas for growth in paragraph form. Focus on their resilience and self-awareness, using examples from the journal.

                Actionable Recommendations: Use a bold <h2> heading and an ordered list (<ol>) for creative, specific strategies to reduce burnout. Avoid generic advice. Tie each recommendation to a specific detail from their journal (e.g., hobbies, challenges, or successes mentioned), and note which specific journal entry date it relates to.

                Encouragement and Closing: Use a bold <h2> heading and a paragraph. Write a compassionate, uplifting message that validates their struggles and encourages them to take positive steps.

                `
            },
            {
              role: "user",
              content: `Here are my journal entries: ${JSON.stringify(journalEntries)}. Please assess my burnout level and suggest actionable steps to improve my well-being.`
            }
          ],
          max_tokens: 1000
        }, {
          headers: {
            "Authorization": `Bearer YOUR_API_KEY`,
            "Content-Type": "application/json"
          }
        });
        this.burnoutReport = response.data.choices[0].message.content;
      } catch (err) {
        console.error(err);
        this.burnoutReport = "Failed to fetch burnout assessment. Please try again.";
      } finally {
        this.loadingReport = false; // Set loading state to false
      }
    },
    async importEntries(event) {
      const file = event.target.files[0];
      if (!file) {
        alert("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target.result;

          let data;
          if (file.name.endsWith(".json")) {
            data = JSON.parse(content);
          } else if (file.name.endsWith(".csv")) {
            data = this.parseCSV(content);
          } else {
            alert("Unsupported file type. Please upload a JSON or CSV file.");
            return;
          }

          // Add entries to the backend and fetch updated logs
          for (const entry of data) {
            if (entry.mood && entry.notes && entry.date) {
              await axios.post("http://localhost:5050/add-mood", {
                mood: entry.mood,
                notes: entry.notes,
                date: entry.date
              });
            }
          }
          this.fetchMoods();
          alert("Entries imported successfully!");
        } catch (err) {
          console.error(err);
          alert("Error processing the file.");
        }
      };
      reader.readAsText(file);
    },
    parseCSV(content) {
      const rows = content.split("\n").filter((row) => row.trim() !== "");
      const headers = rows[0].split(",");
      return rows.slice(1).map((row) => {
        const values = row.split(",");
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim();
          return obj;
        }, {});
      });
    },
    downloadJSONTemplate() {
      const template = [
        {
          mood: "Happy",
          notes: "Write about your day here!",
          date: "2024-11-01"
        }
      ];
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mood_template.json";
      link.click();
      URL.revokeObjectURL(url);
    },
    downloadCSVTemplate() {
      const csvContent =
        "mood,notes,date\n" +
        "Happy,Write about your day here!,2024-11-01\n";
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mood_template.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
    startEdit(entry) {
      this.editingId = entry.id;
      this.editMood = entry.mood;
      this.editNotes = entry.notes;
      this.editDate = entry.date;
    },
    async updateMood(id) {
      try {
        await axios.put(`http://localhost:5050/moods/${id}`, {
          mood: this.editMood,
          notes: this.editNotes,
          date: this.editDate,
        });
        this.editingId = null;
        this.fetchMoods();
      } catch (err) {
        console.error(err);
        alert("Error updating mood");
      }
    },
    cancelEdit() {
      this.editingId = null;
      this.editMood = "";
      this.editNotes = "";
      this.editDate = "";
    },
    async deleteMood(id) {
      try {
        await axios.delete(`http://localhost:5050/moods/${id}`);
        this.fetchMoods();
      } catch (err) {
        console.error(err);
        alert("Error deleting mood");
      }
    },
    formatDate(date) {
      if (!date) return '';
      const parsedDate = new Date(date); // Convert to Date object
      return parsedDate.toLocaleDateString('en-US'); // Format as MM/DD/YYYY
    },
  },
  mounted() {
    this.fetchMoods();
    this.fetchBurnoutLevels();
  },
};
</script>

<style>
/* General Styling */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9f9f9;
}

#app {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Form Inputs */
.form-input,
.form-textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-textarea {
  height: 80px;
  resize: none;
}

/* Buttons */
.form-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.form-button:hover {
  background-color: #0056b3;
}

.form-button.delete {
  background-color: #dc3545;
}

.form-button.delete:hover {
  background-color: #a71d2a;
}

/* Mood Entry Edit Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.edit-input,
.edit-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.edit-buttons {
  display: flex;
  gap: 10px;
}

.edit-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.edit-button.save {
  background-color: #28a745;
  color: white;
}

.edit-button.save:hover {
  background-color: #218838;
}

.edit-button.cancel {
  background-color: #6c757d;
  color: white;
}

.edit-button.cancel:hover {
  background-color: #5a6268;
}
.import-section {
  margin: 20px 0;
}

.import-section input[type="file"] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
}
.vibe-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.vibe-section h2 {
  margin-bottom: 10px;
}

.vibe-section p {
  margin-bottom: 10px;
  font-style: italic;
}

.vibe-section button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.vibe-section button:hover {
  background-color: #0056b3;
}


</style>
