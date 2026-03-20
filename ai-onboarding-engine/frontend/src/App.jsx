import { useState } from 'react';
import { Upload, FileText, Send, CheckCircle, AlertCircle, BookOpen, Target, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [resume, setResume] = useState(null);
  const [uploadType, setUploadType] = useState('text'); // 'text' or 'file'
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleJobDescFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescriptionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      setError("Please upload a resume.");
      return;
    }

    if (uploadType === 'text' && !jobDescriptionText) {
      setError("Please enter job description text.");
      return;
    }
    if (uploadType === 'file' && !jobDescriptionFile) {
      setError("Please upload a job description file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setExtractedData(null);

    const formData = new FormData();
    formData.append('resume', resume);
    
    if (uploadType === 'file') {
      formData.append('jobDescription', jobDescriptionFile);
    } else {
      formData.append('jobDescriptionText', jobDescriptionText);
    }

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Network response was not ok');
      }

      setResponse(data.message);
      setExtractedData({
        resumeText: data.resumeText,
        jobDescriptionText: data.jobDescriptionText
      });
    } catch (err) {
      setError(err.message || "Failed to upload files. Please make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Adaptive Onboarding Engine</h1>
        <p className="subtitle">Upload your resume and job description to get personalized onboarding recommendations.</p>
      </header>

      <main className="main-content">
        {/* Upload Section */}
        <div className="card">
          <h2><Upload className="icon" /> Upload Data</h2>
          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>Upload Resume (PDF/DOCX)</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileText size={24} color="var(--primary-color)" />
                  <span>{resume ? resume.name : "Click to browse or drag & drop"}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Job Description Options:</label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                  <input type="radio" checked={uploadType === 'text'} onChange={() => setUploadType('text')} /> Text Input
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                  <input type="radio" checked={uploadType === 'file'} onChange={() => setUploadType('file')} /> File Upload
                </label>
              </div>

              {uploadType === 'text' ? (
                <textarea 
                  className="text-input" 
                  placeholder="Paste the job requirements or description here..." 
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                />
              ) : (
                <div className="file-input-wrapper">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleJobDescFileChange} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <FileText size={24} color="var(--primary-color)" />
                    <span>{jobDescriptionFile ? jobDescriptionFile.name : "Click to browse or drag & drop"}</span>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Send size={18} /> Submit Data
                </>
              )}
            </button>

            {error && (
              <div className="response-message error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {response && (
              <div className="response-message">
                <CheckCircle size={20} />
                <span>{response}</span>
              </div>
            )}
          </form>
        </div>

        {/* Dynamic / Placeholder Sections */}
        <div className="card">
          <h2><Activity className="icon" /> Analysis Dashboard</h2>
          {extractedData ? (
            <div className="extracted-text-section">
              <div className="text-container">
                <div className="text-container-header">
                  <FileText size={18} /> Resume Text
                </div>
                <div className="text-container-body">
                  {extractedData.resumeText}
                </div>
              </div>

              <div className="text-container">
                <div className="text-container-header">
                  <FileText size={18} /> Job Description Text
                </div>
                <div className="text-container-body">
                  {extractedData.jobDescriptionText}
                </div>
              </div>
            </div>
          ) : (
            <div className="placeholder-section">
              
              <div className="placeholder-item">
                <h3><Target size={18} /> Extracted Skills</h3>
                <p>Awaiting data submission...</p>
                <div className="tag-list" style={{opacity: 0.5}}>
                  <span className="tag">React.js</span>
                  <span className="tag">Node.js</span>
                  <span className="tag">Communication</span>
                </div>
              </div>

              <div className="placeholder-item">
                <h3><AlertCircle size={18} color="#d97706" /> Skill Gap</h3>
                <p>Awaiting data submission...</p>
                <div className="tag-list" style={{opacity: 0.5}}>
                  <span className="tag" style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>AWS</span>
                  <span className="tag" style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>GraphQL</span>
                </div>
              </div>

              <div className="placeholder-item">
                <h3><BookOpen size={18} /> Learning Roadmap</h3>
                <p>Awaiting data submission...</p>
                <div style={{ marginTop: '0.75rem', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', borderLeft: '3px solid var(--primary-color)', backgroundColor: 'white' }}>
                    <strong>Week 1:</strong> Introduction to AWS Services
                  </div>
                  <div style={{ padding: '0.5rem', borderLeft: '3px solid var(--primary-color)', backgroundColor: 'white' }}>
                    <strong>Week 2:</strong> GraphQL Basics & Integration
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
