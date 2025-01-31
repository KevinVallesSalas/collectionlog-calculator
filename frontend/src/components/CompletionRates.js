import React, { useState, useEffect, useRef } from 'react';

function CompletionRates({ onRatesUpdated }) {
  const [completionRates, setCompletionRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetched = useRef(false); // Prevents multiple fetches

  useEffect(() => {
    if (fetched.current) return; // If already fetched, exit
    fetched.current = true; // Mark as fetched

    const fetchCompletionRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/log_importer/get-completion-rates/');
        const json = await response.json();

        if (json.status === 'success' && Array.isArray(json.data)) {
          const defaultRates = json.data;
          const storedRates = JSON.parse(localStorage.getItem('userCompletionRates')) || {};

          const mergedRates = defaultRates.map(rate => ({
            activity_name: rate.activity_name || "Unknown Activity",
            user_completions_per_hour_main: storedRates[rate.activity_name]?.completions_per_hour_main ?? rate.completions_per_hour_main ?? 0,
            user_completions_per_hour_iron: storedRates[rate.activity_name]?.completions_per_hour_iron ?? rate.completions_per_hour_iron ?? 0,
            user_extra_time: storedRates[rate.activity_name]?.extra_time_to_first_completion ?? rate.extra_time_to_first_completion ?? 0,
            default_completions_per_hour_main: rate.completions_per_hour_main ?? 0,
            default_completions_per_hour_iron: rate.completions_per_hour_iron ?? 0,
            default_extra_time: rate.extra_time_to_first_completion ?? 0,
            notes: rate.notes ?? '',
            verification_source: rate.verification_source ?? ''
          }));

          setCompletionRates(mergedRates);
        } else {
          console.error("Invalid API response format:", json);
        }
      } catch (error) {
        console.error('Error fetching completion rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionRates();
  }, []);

  const handleRateChange = (activityName, key, value) => {
    const updatedRates = completionRates.map(rate =>
      rate.activity_name === activityName ? { ...rate, [key]: value || 0 } : rate
    );

    setCompletionRates(updatedRates);

    const storedRates = updatedRates.reduce((acc, rate) => {
      acc[rate.activity_name] = {
        completions_per_hour_main: rate.user_completions_per_hour_main,
        completions_per_hour_iron: rate.user_completions_per_hour_iron,
        extra_time_to_first_completion: rate.user_extra_time
      };
      return acc;
    }, {});

    localStorage.setItem('userCompletionRates', JSON.stringify(storedRates));

    if (onRatesUpdated) onRatesUpdated(storedRates);
  };

  if (isLoading) return <p>Loading completion rates...</p>;

  return (
    <div>
      <h2>Completion Rates</h2>
      {completionRates.length === 0 ? (
        <p>No data available. Please check your API.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Activity Name</th>
              <th>Completions/hr (Main)</th>
              <th>Completions/hr (Iron)</th>
              <th>Extra time to first completion (hours)</th>
              <th>Notes</th>
              <th>Verification Source</th>
            </tr>
          </thead>
          <tbody>
          {completionRates.map((rate, index) => (
              <tr key={index}>
                <td>{rate.activity_name}</td>
                <td>
                  <input
                    type="number"
                    value={rate.user_completions_per_hour_main}
                    onChange={(e) => handleRateChange(rate.activity_name, "user_completions_per_hour_main", Number(e.target.value))}
                    min="0"
                    title={`Default: ${rate.default_completions_per_hour_main}`} 
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rate.user_completions_per_hour_iron}
                    onChange={(e) => handleRateChange(rate.activity_name, "user_completions_per_hour_iron", Number(e.target.value))}
                    min="0"
                    title={`Default: ${rate.default_completions_per_hour_iron}`} 
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rate.user_extra_time}
                    onChange={(e) => handleRateChange(rate.activity_name, "user_extra_time", Number(e.target.value))}
                    min="0"
                    title={`Default: ${rate.default_extra_time} hours`} 
                  />
                </td>
                <td>{rate.notes || '-'}</td>
                <td>{rate.verification_source || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompletionRates;
