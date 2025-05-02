import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';

const FileUpload = () => {
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [indexCreationLink, setIndexCreationLink] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    } else {
      setFiles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setIndexCreationLink(null);
      
      const filesRef = collection(db, 'files');
      const q = query(
        filesRef,
        where('userId', '==', user.uid),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const userFiles = [];
      const uniqueFolders = new Set(['all']);
      const uniqueTags = new Set(['all']);
      
      querySnapshot.forEach((doc) => {
        const fileData = { id: doc.id, ...doc.data() };
        userFiles.push(fileData);
        
        if (fileData.folder) uniqueFolders.add(fileData.folder);
        if (fileData.tags) {
          fileData.tags.forEach(tag => uniqueTags.add(tag));
        }
      });
      
      setFiles(userFiles);
      setFolders(Array.from(uniqueFolders));
      setTags(Array.from(uniqueTags));
    } catch (error) {
      console.error('Error fetching files:', error);
      if (error.code === 'failed-precondition') {
        // Extract the index creation link from the error message
        const linkMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^"]+/);
        if (linkMatch) {
          setIndexCreationLink(linkMatch[0]);
          setError('A composite index is required. Click the link below to create it:');
        } else {
          setError('Please create a composite index for userId and uploadedAt in Firestore.');
        }
      } else {
        setError('Failed to fetch files. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (!user) {
      setError('Please sign in to upload files');
      return;
    }
    setUploading(true);
    const cloudinaryWidget = window.cloudinary.createUploadWidget({
      cloudName: 'dr4kcpueq',
      uploadPreset: 'file-upload-items',
      folder: selectedFolder !== 'all' ? selectedFolder : undefined,
      tags: selectedTag !== 'all' ? [selectedTag] : undefined
    }, async (error, result) => {
      if (error) {
        setUploading(false);
        console.error('Cloudinary upload error:', error);
        setError('Upload failed. Please try again.');
        return;
      }
      if (result && result.event === 'success') {
        try {
          const filesRef = collection(db, 'files');
          await addDoc(filesRef, {
            userId: user.uid,
            publicId: result.info.public_id,
            originalFilename: result.info.original_filename,
            url: result.info.secure_url,
            uploadedAt: new Date(),
            size: result.info.bytes,
            format: result.info.format,
            folder: selectedFolder !== 'all' ? selectedFolder : null,
            tags: selectedTag !== 'all' ? [selectedTag] : []
          });
          await fetchUserFiles();
        } catch {
          setError('Failed to save file information. Please try again.');
        } finally {
          setUploading(false);
        }
      }
      // Reset uploading if widget is closed/cancelled
      if (result && result.event === 'close') {
        setUploading(false);
      }
    });
    cloudinaryWidget.open();
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteDoc(doc(db, 'files', fileId));
    setFiles(files.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Error deleting file:', error);
        setError('Failed to delete file. Please try again.');
      }
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setNewFileName(file.originalFilename);
  };

  const handleUpdate = async (fileId) => {
    try {
      await updateDoc(doc(db, 'files', fileId), {
        originalFilename: newFileName
      });
      setEditingFile(null);
      await fetchUserFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      setError('Failed to update file. Please try again.');
    }
  };

  const handleCreateFolder = async () => {
    if (newFolder.trim()) {
      setFolders([...folders, newFolder.trim()]);
      setSelectedFolder(newFolder.trim());
      setShowNewFolderModal(false);
      setNewFolder('');
    }
  };

  const handleCreateTag = async () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setSelectedTag(newTag.trim());
      setShowNewTagModal(false);
      setNewTag('');
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = file.originalFilename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError('Failed to download file.');
    }
  };

  const filteredFiles = files.filter(file => {
    const folderMatch = selectedFolder === 'all' || file.folder === selectedFolder;
    const tagMatch = selectedTag === 'all' || (file.tags && file.tags.includes(selectedTag));
    return folderMatch && tagMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec] flex flex-col items-center justify-center py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-700 py-8">
          <p className="text-red-600 dark:text-red-300">{error}</p>
          {indexCreationLink && (
            <a
              href={indexCreationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-primary-600 hover:text-primary-700 underline"
            >
              Create Required Index
            </a>
          )}
        </div>
      )}
      
      {user ? (
        <>
          {/* Responsive Neumorphic Control Bar */}
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:gap-4 sm:mb-8">
            <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:gap-2 sm:rounded-2xl sm:bg-[#e0e5ec] sm:shadow-[8px_8px_24px_#a3b1c6,-8px_-8px_24px_#ffffff] sm:px-4 sm:py-4 sm:backdrop-blur-md sm:w-auto rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_24px_#a3b1c6,-8px_-8px_24px_#ffffff] px-4 py-4">
              <div className="flex items-center gap-3 sm:gap-2">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="input py-2 min-w-[120px] rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] border-none focus:ring-2 focus:ring-blue-200"
                >
                  {folders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder === 'all' ? 'All Folders' : folder}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="rounded-full w-12 h-12 flex items-center justify-center bg-[#e0e5ec] shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] text-gray-700 transition hover:shadow-[inset_8px_8px_16px_#a3b1c6,inset_-8px_-8px_16px_#ffffff]"
                  title="New Folder"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3 sm:gap-2">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="input py-2 min-w-[120px] rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] border-none focus:ring-2 focus:ring-blue-200"
                >
                  {tags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All Tags' : tag}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewTagModal(true)}
                  className="rounded-full w-12 h-12 flex items-center justify-center bg-[#e0e5ec] shadow-[8px_8px_16px_#a3b1c6,-8px_-8px_16px_#ffffff] text-gray-700 transition hover:shadow-[inset_8px_8px_16px_#a3b1c6,inset_-8px_-8px_16px_#ffffff]"
                  title="New Tag"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7a2 2 0 012-2h3.586a1 1 0 01.707.293l7.414 7.414a2 2 0 010 2.828l-4.586 4.586a2 2 0 01-2.828 0l-7.414-7.414A1 1 0 013 10.586V7a2 2 0 012-2z" />
                    <circle cx="7.5" cy="7.5" r="1.5" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleUpload}
                className="flex items-center justify-center gap-2 rounded-full w-16 h-16 bg-gradient-to-r from-sky-200 to-blue-300 shadow-[8px_8px_24px_#a3b1c6,-8px_-8px_24px_#ffffff] text-blue-700 shadow-lg hover:from-sky-300 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition disabled:opacity-60 sm:ml-4"
                disabled={uploading}
              >
                {uploading ? (
                  <span className="loader mr-2"></span>
                ) : (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Responsive File Grid with Scrollable Container */}
          <div className="grid grid-cols-1 gap-3 mt-0 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className="bg-[#e0e5ec] rounded-2xl p-4 shadow-[4px_4px_12px_#bfc9d9,-4px_-4px_12px_#ffffff] flex flex-col gap-2 w-full sm:mb-0"
              >
                {editingFile?.id === file.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="input rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] border-none focus:ring-2 focus:ring-blue-200 text-gray-800"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(file.id)}
                        className="btn btn-primary flex-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFile(null)}
                        className="btn btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-800 truncate">
                        {file.originalFilename}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(file)}
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {file.folder && (
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {file.folder}
                        </div>
                      )}
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs bg-gray-200 rounded-full text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {new Date(file.uploadedAt?.toDate()).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDownload(file)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Download
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Please sign in</h3>
          <p className="mt-1 text-sm text-gray-500">Sign in to access your files.</p>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Folder name"
              className="input mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Tag Modal */}
      {showNewTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tag</h3>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Tag name"
              className="input mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewTagModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                className="btn btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;