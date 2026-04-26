import React from "react";
import { Modal as RBModal, Button } from "react-bootstrap";

export default function Modal({
  open,
  title,
  children,
  onClose,
  onAction,
  actionText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  loading = false,
}) {
  return (
    <RBModal show={open} onHide={onClose} centered>
      {title && (
        <RBModal.Header closeButton>
          <RBModal.Title>{title}</RBModal.Title>
        </RBModal.Header>
      )}
      <RBModal.Body>{children}</RBModal.Body>
      <RBModal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={onAction}
          disabled={loading}
        >
          {loading ? "Please wait…" : actionText}
        </Button>
      </RBModal.Footer>
    </RBModal>
  );
}
