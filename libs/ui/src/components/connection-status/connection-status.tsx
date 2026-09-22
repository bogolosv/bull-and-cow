import styles from "./connection-status.module.css";
export type ConnectionStatusProps = {
  labels: ConnectionStatusLabels;
  status: "online" | "connecting" | "offline";
};
export function ConnectionStatus({ labels, status }: ConnectionStatusProps) {
  const label =
    status === "online"
      ? labels.online
      : status === "offline"
        ? labels.offline
        : labels.connecting;
  return (
    <span
      className={`${styles.connection} ${status === "online" ? styles.online : ""}`}
      role="status"
      aria-label={label}
      title={label}
    >
      <i />
      {status !== "online" &&
        (status === "offline" ? labels.offlineText : labels.connectingText)}
    </span>
  );
}

export type ConnectionStatusLabels = {
  online: string;
  offline: string;
  connecting: string;
  offlineText: string;
  connectingText: string;
};
