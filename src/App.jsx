import { useRef, useState } from 'react';
import file from './assets/file.png';
import './App.css';
import { toast } from 'react-toastify';

const App = () => {
  const API_URL =
    "https://excel-project-backend.onrender.com/api/"
  // "localhost:3000/api/"  
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [disableDownload, setDisableDownload] = useState(true)
  const [filePath, setFilePath] = useState('')
  const maxAllowedSize = 300 * 1024 * 1024;


  const [productName, setProductName] = useState('');
  const [includePhoneNo, setIncludePhoneNo] = useState(false);

  const handleDownload = async () => {
    try {
      const request = { productName, includePhoneNo }
      const response = await fetch(API_URL + 'download/' + filePath,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify(request)

        });
      const blob = await response.blob();

      // Create a download link dynamically
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.xlsx'; // filename to download
      document.body.appendChild(a);
      a.click();

      // Clean up
      a.remove();
      window.URL.revokeObjectURL(url);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json(); // Assuming the response is JSON
      console.log('File downloaded successfully', data.path);
    } catch (error) {
      console.error('Error downloading file:', error);
    }

    resetFileInput()
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current.classList.add('dragged');
  };

  const handleDragLeave = () => {
    dropZoneRef.current.classList.remove('dragged');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInputRef.current.files = files;
      uploadFile();
    }
    dropZoneRef.current.classList.remove('dragged');
  };

  const handleFileChange = () => {
    uploadFile();
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const updateProgress = (e) => {
    const percent = Math.round((e.loaded / e.total) * 100);
    setProgress(percent);
  };

  const uploadFile = async () => {
    const file = fileInputRef.current.files[0];
    if (file.size > maxAllowedSize) {
      showToastMessage("Can't upload more than 300MB");
      resetFileInput();
      return;
    }



    const formData = new FormData();
    formData.append('file', file); // Append the file with the field name 'file'

    setProgress(1)
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = async () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const res = JSON.parse(xhr.response);

        setFilePath(res.file);
        setDisableDownload(false)
        toast.success('File uploaded successfully!');
      }
    };

    xhr.upload.onprogress = updateProgress;

    xhr.upload.onerror = () => {
      resetFileInput();
      showToastMessage(`Error in upload: ${xhr.statusText}`);
      setProgress(0);
    };

    xhr.open('POST', API_URL + "files");
    xhr.send(formData);
  };


  const resetFileInput = () => {
    fileInputRef.current.value = '';
    setProgress(0);
  };

  const showToastMessage = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="app">
      <section className="upload-container">
        <div
          ref={dropZoneRef}
          className="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="icon-container">
            <img src={file} alt="File Icon" className="center" draggable="false" />
            <img src={file} alt="File Icon" className="right" draggable="false" />
            <img src={file} alt="File Icon" className="left" draggable="false" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="title">
            Drop your files here or, <span className="browsebtn" onClick={handleBrowseClick}>browse</span>
          </div>
        </div>

        {progress > 0 && (
          <div className="progress-container">
            <div className="bg-progress" style={{ width: `${progress}%` }}></div>
            <div className="inner-container">
              <div className="title">Uploading...</div>
              <div className="percent-container">
                <span>{progress}</span>%
              </div>
              <div className="progress-bar" style={{ transform: `scaleX(${progress / 100})` }}></div>
            </div>
          </div>
        )}
      </section>

      <section className="filter-container">
        <h2>Filters</h2>
        {/* Input for product name */}
        <label htmlFor="productName">Product Name:</label>
        <input
          type='text'
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />

        {/* Checkbox for include phone number */}
        <div>
          <input
            type="checkbox"
            id="includePhoneNo"
            checked={includePhoneNo}
            onChange={(e) => setIncludePhoneNo(e.target.checked)}
          />
          <label htmlFor="includePhoneNo">Include Phone Number</label>
        </div>

        {!disableDownload && <button onClick={handleDownload}>
          Download
        </button>}

      </section>

      {showToast && (
        <div className="toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
