import DocumentsPanel from "../components/DocumentsPanel.jsx";

// Employee apni files upload kar sakta hai aur dekh sakta hai. HR ki upload ki hui file sirf HR hata sakti hai.
const urls = {
  list: "/me/documents",
  upload: "/me/documents",
  download: (d) => `/me/documents/${d._id}/download`,
  remove: (d) => `/me/documents/${d._id}`,
};

export default function MyDocuments() {
  return (
    <div>
      <div className="toolbar">
        <h2>My Documents</h2>
      </div>
      <DocumentsPanel urls={urls} canDelete={(d) => d.uploadedByRole === "employee"} />
    </div>
  );
}
