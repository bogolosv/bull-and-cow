import styles from "./room-list.module.css";
import type { ReactNode } from "react";
export function RoomList({ children }: { children: ReactNode }) {
  return <ul className={styles.roomList}>{children}</ul>;
}
