import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const Stats = () => {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [actualData, setActualData] = useState([]);
  const [metaData, setMetaData] = useState({});
  const [validUsers, setValidUsers] = useState(0);

  const fetchActualData = async (uids) => {
    const { data, error } = await supabase
      .from('employees')
      .select('empid, empname, classification, division, department, site, directorate, uid, grouping')
      .in('uid', uids);

    if (error) {
      console.error('Error fetching data:', error);
      return [];
    }
    return data;
  };

  const normalizeText = (text) => {
    if (!text) return 'Others';
    return text.replace(/CABANG.*|-.*/, '').trim();
  };

  const generateMetaData = (data, rankOne) => {
    if (data.length === 0) return {};

    const normalizedData = data.map((row) => ({
      ...row,
      division: normalizeText(row.division),
      department: normalizeText(row.department),
      site: normalizeText(row.site),
      directorate: normalizeText(row.directorate),
      grouping: normalizeText(row.grouping || 'Others'),
    }));

    const departmentCount = {};
    const siteCount = {};
    const directorateCount = {};
    const groupingCount = {};

    normalizedData.forEach((row) => {
      const department = row.classification === 'HO' ? row.division : row.classification === 'Branch' ? row.department : 'Others';
      departmentCount[department] = (departmentCount[department] || 0) + 1;
      siteCount[row.site] = (siteCount[row.site] || 0) + 1;
      directorateCount[row.directorate] = (directorateCount[row.directorate] || 0) + 1;
      groupingCount[row.grouping] = (groupingCount[row.grouping] || 0) + 1;
    });

    const totalPlayers = normalizedData.length;

    const departmentPercentages = Object.entries(departmentCount).map(([dept, count]) => ({
      department: dept,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%',
    }));

    const sitePercentages = Object.entries(siteCount).map(([s, count]) => ({
      site: s,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%',
    }));

    const directoratePercentages = Object.entries(directorateCount).map(([dir, count]) => ({
      directorate: dir,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%',
    }));

    const groupingPercentages = Object.entries(groupingCount).map(([grp, count]) => ({
      grouping: grp,
      count,
      percentage: ((count / totalPlayers) * 100).toFixed(2) + '%',
    }));

    return {
      winner: rankOne,
      departmentDistribution: departmentPercentages,
      siteDistribution: sitePercentages,
      directorateDistribution: directoratePercentages,
      groupingDistribution: groupingPercentages,
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
  
    const actualDataFromSupabase = await fetchActualData(uids);
    setActualData(actualDataFromSupabase);
  
    // Calculate valid users count
    const validCount = actualDataFromSupabase.filter(
      (row) => row.uid !== 'N/A' && row.empid !== 'N/A'
    ).length;
  
    setValidUsers(validCount); // Update the state with the count of valid users
  
    const rankOnePlayer = data[0] || {};
    const rankTwoPlayer = data[1] || {};
    const rankThreePlayer = data[2] || {};
  
    const getActualPlayerDetails = (uid) =>
      actualDataFromSupabase.find((row) => row.uid === uid) || null;
  
    let winner = getActualPlayerDetails(rankOnePlayer['Player']) || getActualPlayerDetails(rankTwoPlayer['Player']) || getActualPlayerDetails(rankThreePlayer['Player']) || {
      empid: 'N/A',
      empname: 'No valid winner found',
      department: 'N/A',
      site: 'N/A',
      directorate: 'N/A',
      uid: 'N/A',
    };
  
    const metaDataResult = generateMetaData(actualDataFromSupabase, winner);
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
            <h4 className="font-semibold">General Stats:</h4>
            <p>Total Players: {parsedData.length}</p>
            <p>Valid Users: {validUsers}</p>
            <p>Invalid Users: {parsedData.length - validUsers}</p>
            <br />
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

            <h4 className="font-semibold mt-4">Grouping Distribution:</h4>
            <ul>
              {metaData.groupingDistribution.map((group, index) => (
                <li key={index}>
                  {group.grouping}: {group.count} ({group.percentage})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
