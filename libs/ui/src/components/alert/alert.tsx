import styles from "./alert.module.css";
export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className={styles.errorMessage} role="alert">
      {children}
    </p>
  );
}
