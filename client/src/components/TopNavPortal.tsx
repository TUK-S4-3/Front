import { createPortal } from "react-dom";
import TopNav from "./TopNav";

export default function TopNavPortal() {
  return createPortal(<TopNav />, document.body);
}