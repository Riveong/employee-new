import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const Stats = () => { 
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [actualData, setActualData] = useState([]);
  const [metaData, setMetaData] = useState({});

  const fetchActualData = async (uids) => {
    const { data, error } = await supabase
      .from('employees') // Table name is 'employees'
      .select('empid, empname, classification, division, department, site, directorate, uid') // Added directorate column
      .in('uid', uids);

    if (error) {
      console.error('Error fetching data:', error);
      return [];
    }
    return data;
  };

  const normalizeText = (text) => {
    if (!text) return 'Others';
    return text.replace(/CABANG.*|-.*/, '').trim(); // Removes "CABANG" and everything after "-"
  };

  const generateMetaData = (data, rankOne) => {
    if (data.length === 0) return {};

    // Normalize data after fetching but before calculation
    const normalizedData = data.map((row) => ({
      ...row,
      division: normalizeText(row.division),
      department: normalizeText(row.department),
      site: normalizeText(row.site),
      directorate: normalizeText(row.directorate),
    }));

    const departmentCount = {};
    const siteCount = {};
    const directorateCount = {};

    normalizedData.forEach((row) => {
      const department = row.classification === 'HO' ? row.division : row.classification === 'Branch' ? row.department : 'Others';
      departmentCount[department] = (departmentCount[department] || 0) + 1;
      siteCount[row.site] = (siteCount[row.site] || 0) + 1;
      directorateCount[row.directorate] = (directorateCount[row.directorate] || 0) + 1;
    });

    const totalPlayers = normalizedData.length;
    const departmentPercentages = Object.entries(departmentCount).map(([dept, count]) => ({
      department: dept,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%'
    }));

    const sitePercentages = Object.entries(siteCount).map(([s, count]) => ({
      site: s,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%'
    }));

    const directoratePercentages = Object.entries(directorateCount).map(([dir, count]) => ({
      directorate: dir,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%'
    }));

    return {
      winner: rankOne,
      departmentDistribution: departmentPercentages,
      siteDistribution: sitePercentages,
      directorateDistribution: directoratePercentages,
    };
  };

  const parseTextData = async () => {
    if (!rawText.trim()) {
      alert('Please paste the data in the textarea');
      return;
    }

    const rows = rawText.trim().split('\n');
    const headers = rows[0].split('\t');

    const data = rows.slice(1).map((row) => {
      const values = row.split('\t');
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header.trim()] = values[index]?.trim() || 'N/A';
      });
      return rowData;
    });

    setParsedData(data);

    const uids = data.map((row) => row['Player']).filter((uid) => uid !== 'N/A');

    // Get the first rank (winner) from the parsed data
    const rankOnePlayer = data[0];
    const rankOne = {
      empid: 'N/A',
      empname: rankOnePlayer['Player Name'] || 'N/A',
      department: 'Loading...',
      site: 'Loading...',
      directorate: 'Loading...',
      uid: rankOnePlayer['Player'] || 'N/A'
    };

    // Fetch actual data from Supabase after getting the rank one
    const actualDataFromSupabase = await fetchActualData(uids);
    setActualData(actualDataFromSupabase);

    // Find the actual rank one details if they exist in fetched data
    const actualRankOne = actualDataFromSupabase.find((row) => row.uid === rankOne.uid) || rankOne;

    const metaDataResult = generateMetaData(actualDataFromSupabase, actualRankOne);
    setMetaData(metaDataResult);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold text-center">Statistic Processor</h1>
      <div className="mt-4">
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded"
          placeholder="Paste your data here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
      </div>
      <div className="mt-4 text-center">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          onClick={parseTextData}
        >
          Process Data
        </button>
      </div>

      {metaData?.winner && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Meta Data:</h3>
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold">Winner:</h4>
            <p>Employee ID: {metaData.winner.empid}</p>
            <p>Employee Name: {metaData.winner.empname}</p>
            <p>Department: {metaData.winner.department}</p>
            <p>Site: {metaData.winner.site}</p>
            <p>Directorate: {metaData.winner.directorate}</p>
            <p>UID: {metaData.winner.uid}</p>

            <h4 className="font-semibold mt-4">Department Distribution:</h4>
            <ul>
              {metaData.departmentDistribution.map((dept, index) => (
                <li key={index}>
                  {dept.department}: {dept.count} ({dept.percentage})
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mt-4">Site Distribution:</h4>
            <ul>
              {metaData.siteDistribution.map((site, index) => (
                <li key={index}>
                  {site.site}: {site.count} ({site.percentage})
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mt-4">Directorate Distribution:</h4>
            <ul>
              {metaData.directorateDistribution.map((dir, index) => (
                <li key={index}>
                  {dir.directorate}: {dir.count} ({dir.percentage})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {actualData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Supabase Actual Data:</h3>
          <div className="overflow-x-auto bg-gray-100 p-4 rounded">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Employee ID</th>
                  <th className="border px-2 py-1">Employee Name</th>
                  <th className="border px-2 py-1">Classification</th>
                  <th className="border px-2 py-1">Division</th>
                  <th className="border px-2 py-1">Department</th>
                  <th className="border px-2 py-1">Site</th>
                  <th className="border px-2 py-1">Directorate</th>
                  <th className="border px-2 py-1">UID</th>
                </tr>
              </thead>
              <tbody>
                {actualData.map((row, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1">{row.empid}</td>
                    <td className="border px-2 py-1">{row.empname}</td>
                    <td className="border px-2 py-1">{row.classification}</td>
                    <td className="border px-2 py-1">{row.division}</td>
                    <td className="border px-2 py-1">{row.department}</td>
                    <td className="border px-2 py-1">{row.site}</td>
                    <td className="border px-2 py-1">{row.directorate}</td>
                    <td className="border px-2 py-1">{row.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsedData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Raw Data:</h3>
          <div className="overflow-x-auto bg-gray-100 p-4 rounded">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((header) => (
                    <th key={header} className="border px-2 py-1">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex} className="border px-2 py-1">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
