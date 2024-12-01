<template>
    <canvas ref="chartCanvas"></canvas>
  </template>
  
  <script>
  import { ref, onMounted, watch } from "vue";
  import { Chart, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, LineController } from "chart.js";
  
  // Register required Chart.js components
  Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, LineController);
  
  export default {
    name: "LineChart",
    props: {
      chartData: {
        type: Object,
        required: true,
      },
      chartOptions: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const chartCanvas = ref(null);
      let chartInstance = null;
  
      const renderChart = () => {
        if (chartInstance) {
          chartInstance.destroy(); // Destroy the existing chart instance
        }
        chartInstance = new Chart(chartCanvas.value, {
          type: "line", // Ensure the type is "line"
          data: props.chartData,
          options: props.chartOptions,
        });
      };
  
      onMounted(() => {
        renderChart();
      });
  
      watch(
        () => props.chartData,
        () => {
          renderChart(); // Re-render chart when `chartData` updates
        },
        { deep: true }
      );
  
      return {
        chartCanvas,
      };
    },
  };
  </script>
  
  <style scoped>
  canvas {
    max-width: 100%;
  }
  </style>
  