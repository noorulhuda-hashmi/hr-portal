import { useEffect, useRef, useState } from "react";
import api from "../services/api.js";

const CATEGORIES = { cnic: "CNIC", contract: "Contract", resume: "Resume / CV", certificate: "Certificate", other: "Other" };
const TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 2 * 1024 * 1024;

const sizeText = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Blob mode mein server ka error bhi blob aata hai, use parha ja sakne wala text banate hain
const errorText = async (err, fallback) => {
  const data = err.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.message || err.message || fallback;
};

// urls: { list, upload, download(d), remove(d) }, canDelete(d): bool
export default function DocumentsPanel({ urls, canDelete }) {
  const [docs, setDocs] = useState(null);
  const [category, setCategory] = useState("cnic");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const load = () =>
    api
      .get(urls.list)
      .then((res) => setDocs(res.data))
      .catch(async (err) => setError(await errorText(err, "Failed to load documents")));

  useEffect(() => {
    load();
  }, [urls.list]);

  const pick = (e) => {
    setError("");
    setMessage("");
    const f = e.target.files[0];
    if (!f) return setFile(null);
    if (!TYPES.includes(f.type)) {
      setFile(null);
      e.target.value = "";
      return setError("Only PDF, PNG or JPG files are allowed");
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      e.target.value = "";
      return setError("File is too large (maximum 2 MB)");
    }
    setFile(f);
  };

  const upload = async () => {
    setError("");
    setMessage("");
    if (!file) return setError("Please choose a file first");
    setBusy(true);
    try {
      await api.post(urls.upload, file, {
        headers: { "Content-Type": file.type },
        params: { category, name: file.name },
      });
      setMessage("Document uploaded");
      setFile(null);
      if (input.current) input.current.value = "";
      load();
    } catch (err) {
      setError(await errorText(err, "Could not upload document"));
    } finally {
      setBusy(false);
    }
  };

  const download = async (d) => {
    setError("");
    try {
      const res = await api.get(urls.download(d), { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(await errorText(err, "Could not download document"));
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.originalName}"?`)) return;
    setError("");
    setMessage("");
    try {
      await api.delete(urls.remove(d));
      setMessage("Document deleted");
      load();
    } catch (err) {
      setError(await errorText(err, "Could not delete document"));
    }
  };

  return (
    <section className="panel">
      <h3>Documents</h3>
      <p className="hint">PDF, PNG or JPG, up to 2 MB each, maximum 10 per employee.</p>

      <div className="upload-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={pick} />
        <button disabled={busy || !file} onClick={upload}>
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>File</th>
            <th>Size</th>
            <th>Uploaded by</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs && docs.length === 0 && (
            <tr>
              <td colSpan="6">No documents yet.</td>
            </tr>
          )}
          {docs?.map((d) => (
            <tr key={d._id}>
              <td>{CATEGORIES[d.category]}</td>
              <td>{d.originalName}</td>
              <td>{sizeText(d.size)}</td>
              <td>
                {d.uploadedByName} <small>({d.uploadedByRole})</small>
              </td>
              <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="row-actions">
                  <button className="secondary" onClick={() => download(d)}>
                    Download
                  </button>
                  {canDelete(d) && (
                    <button className="danger" onClick={() => remove(d)}>
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
