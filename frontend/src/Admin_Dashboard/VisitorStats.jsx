import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function VisitorStats({ side, setSide, admin }) {
  const [stats, setStats] = useState({
    dailyVisitorStats: [],
    deviceStats: [],
    browserStats: [],
    osStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch visitor stats
  useEffect(() => {
    const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/analytics/visitor-stats`;
    setLoading(true);
    axios
      .get(apiUrl, { withCredentials: true })
      .then((res) => {
        console.log('Visitor Stats Data:', res.data); // Debug API response
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setError('Failed to load visitor statistics');
        setLoading(false);
      });
  }, []);

  // Chart data for daily visitors
  const dailyVisitorChartData = {
    labels: stats.dailyVisitorStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Unique Visitors',
        data: stats.dailyVisitorStats.map((stat) => stat.uniqueVisitors),
        backgroundColor: '#10B981', // Distinct color for daily visitors
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for devices, browsers, and OS
  const deviceChartData = {
    labels: stats.deviceStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Devices',
        data: stats.deviceStats.map((stat) => stat.count),
        backgroundColor: '#3B5EB7',
        borderColor: '#3B5EB7',
        borderWidth: 1,
      },
    ],
  };

  const browserChartData = {
    labels: stats.browserStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Browsers',
        data: stats.browserStats.map((stat) => stat.count),
        backgroundColor: '#3B5EB7',
        borderColor: '#3B5EB7',
        borderWidth: 1,
      },
    ],
  };

  const osChartData = {
    labels: stats.osStats.map((stat) => stat._id || 'Unknown'),
    datasets: [
      {
        label: 'Operating Systems',
        data: stats.osStats.map((stat) => stat.count),
        backgroundColor: '#3B5EB7',
        borderColor: '#3B5EB7',
        borderWidth: 1,
      },
    ],
  };

  // Chart options for consistent styling
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Visitor Count' } },
      x: { title: { display: true, text: 'Category' } },
    },
  };

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen">
          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Visitor Statistics</h2>

            {loading ? (
              <div className="text-center text-gray-500 py-10">
                <p>Loading visitor stats...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-10">
                <p>{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Visitors Chart */}
                <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Daily Unique Visitors</h3>
                  <Bar
                    data={dailyVisitorChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Daily Unique Visitors' } },
                      scales: {
                        ...chartOptions.scales,
                        x: { title: { display: true, text: 'Date' } },
                      },
                    }}
                    height={200}
                  />
                </div>

                {/* Device Chart */}
                <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Devices</h3>
                  <Bar
                    data={deviceChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Devices' } },
                    }}
                    height={200}
                  />
                </div>

                {/* Browser Chart */}
                <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Browsers</h3>
                  <Bar
                    data={browserChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Browsers' } },
                    }}
                    height={200}
                  />
                </div>

                {/* OS Chart */}
                <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Operating Systems</h3>
                  <Bar
                    data={osChartData}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: true, text: 'Operating Systems' } },
                    }}
                    height={200}
                  />
                </div>
              </div>
            )}

            {/* Fallback List View */}
            {!loading && !error && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Daily Unique Visitors</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {stats.dailyVisitorStats.map((stat) => (
                        <li key={stat._id} className="py-1">
                          {stat._id}: {stat.uniqueVisitors} unique visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Devices</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {stats.deviceStats.map((stat) => (
                        <li key={stat._id} className="py-1">
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Browsers</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {stats.browserStats.map((stat) => (
                        <li key={stat._id} className="py-1">
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Operating Systems</h4>
                    <ul className="list-disc pl-5 text-gray-600">
                      {stats.osStats.map((stat) => (
                        <li key={stat._id} className="py-1">
                          {stat._id || 'Unknown'}: {stat.count} visitors
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorStats;