import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { 
  FileIcon, 
  ImageIcon, 
  VideoIcon, 
  FileTextIcon, 
  Upload, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FileUpload = ({ onFileUploaded, channelId, recipientId, disabled = false }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-8 w-8 text-purple-500" />;
    if (type.includes('text') || type.includes('document')) return <FileTextIcon className="h-8 w-8 text-green-500" />;
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender_id', user.id);
    formData.append('sender_name', user.name);
    if (channelId) formData.append('channel_id', channelId);
    if (recipientId) formData.append('recipient_id', recipientId);

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadSuccess(false);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${backendUrl}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadSuccess(true);
      onFileUploaded?.(result);

      // Reset after 2 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      await uploadFile(file);
    }
  }, [channelId, recipientId, user]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/*': ['.txt', '.csv'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv']
    }
  });

  if (uploading || uploadSuccess) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {uploading && (
              <>
                <Upload className="h-8 w-8 text-blue-500 mx-auto animate-bounce" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Uploading file...</p>
                  <Progress value={uploadProgress} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                </div>
              </>
            )}
            {uploadSuccess && (
              <>
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-green-700">File uploaded successfully!</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadError) {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Upload failed</p>
              <p className="text-xs text-red-600">{uploadError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`border-2 border-dashed cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <CardContent className="p-6">
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Upload className={`h-6 w-6 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <p className={`text-sm font-medium ${isDragActive ? 'text-blue-700' : 'text-gray-700'}`}>
              {isDragActive ? 'Drop file here' : 'Drag & drop a file here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse (max 50MB)
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Supported: Images, PDFs, Documents, Videos, Text files
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// File message component for displaying shared files in chat
export const FileMessage = ({ message }) => {
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileIcon className="h-6 w-6 text-gray-500" />;
    
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (fileType.startsWith('video/')) return <VideoIcon className="h-6 w-6 text-purple-500" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileTextIcon className="h-6 w-6 text-green-500" />;
    return <FileIcon className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (message.file_url) {
      window.open(message.file_url, '_blank');
    }
  };

  const isImage = message.file_type && message.file_type.startsWith('image/');

  return (
    <div className="max-w-sm">
      <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
        <CardContent className="p-3">
          {isImage ? (
            <div className="space-y-2">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={message.file_url}
                  alt={message.file_name}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleDownload}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 truncate">{message.file_name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(message.file_size)}</p>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={handleDownload}
            >
              <div className="flex-shrink-0">
                {getFileIcon(message.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{message.file_name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(message.file_size)}</p>
              </div>
              <div className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <FileIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;