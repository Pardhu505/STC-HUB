import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { uploadAttendance, getAttendance } from '../config/api';

const Attendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  useEffect(() => {
    filterDataByDate();
  }, [startDate, endDate, attendanceData]);

  const fetchAttendanceData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getAttendance(user.id);
      setAttendanceData(data);
      setFilteredData(data);
    } catch (err) {
      setError('Failed to fetch attendance data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await uploadAttendance(selectedFile);
      // Refresh data after upload
      fetchAttendanceData();
    } catch (err) {
      setError('Failed to upload attendance file.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDataByDate = () => {
    let data = [...attendanceData];
    if (startDate) {
      data = data.filter(d => new Date(d.date) >= new Date(startDate));
    }
    if (endDate) {
      data = data.filter(d => new Date(d.date) <= new Date(endDate));
    }
    setFilteredData(data);
  };

  const getSummaryCounts = () => {
    const counts = {
      present: 0,
      absent: 0,
      holiday: 0,
      weekoff: 0,
    };
    filteredData.forEach(record => {
      if (record.status.toLowerCase() === 'present') counts.present++;
      else if (record.status.toLowerCase() === 'absent') counts.absent++;
      else if (record.status.toLowerCase() === 'holiday') counts.holiday++;
      else if (record.status.toLowerCase() === 'weekoff') counts.weekoff++;
    });
    return counts;
  };

  const summary = getSummaryCounts();

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Report</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.isAdmin && (
            <div className="mb-4 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Upload Attendance CSV</h3>
              <div className="flex gap-2">
                <Input type="file" onChange={handleFileChange} accept=".csv" />
                <Button onClick={handleFileUpload} disabled={!selectedFile || isLoading}>
                  {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">From Date</label>
              <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">To Date</label>
              <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Present</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.present}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.absent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.holiday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weekoffs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary.weekoff}</p>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>In Time</TableHead>
                <TableHead>Out Time</TableHead>
                <TableHead>Work Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan="7" className="text-center">Loading...</TableCell></TableRow>
              ) : (
                filteredData.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employee_id}</TableCell>
                    <TableCell>{record.employee_name}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.s_in_time}</TableCell>
                    <TableCell>{record.s_out_time}</TableCell>
                    <TableCell>{record.work_duration}</TableCell>
                    <TableCell>{record.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
