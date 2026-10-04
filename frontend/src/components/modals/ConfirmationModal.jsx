import { RestoreIcon, TrashIcon } from "../common/icons";

export default function ConfirmationModal({ type, mail, loading, onCancel, onConfirm }) {
  const isRestore = type === "restore";

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className={`modal-icon ${isRestore ? "restore" : "delete"}`}>
          {isRestore ? <RestoreIcon /> : <TrashIcon />}
        </div>

        <div className="modal-content">
          <h3>{isRestore ? "Restore this email?" : "Delete this email?"}</h3>

          <p>
            {isRestore
              ? "This email will be moved back to your Gmail inbox."
              : "This will permanently delete the email from Gmail. This action cannot be undone."}
          </p>

          {mail && (
            <div className="modal-email">
              <strong>{mail.subject || "No Subject"}</strong>

              <span>{mail.sender || "Unknown sender"}</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={
              isRestore
                ? "modal-confirm restore-confirm"
                : "modal-confirm delete-confirm"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Processing...
              </>
            ) : isRestore ? (
              <>
                <RestoreIcon />
                Restore email
              </>
            ) : (
              <>
                <TrashIcon />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
