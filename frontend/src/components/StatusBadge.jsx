import React from "react";
import { getStatus } from "../utils/status";

const StatusBadge = ({ status, short = false }) => {
  const { label, short: shortLabel, Icon, tone } = getStatus(status);
  return (
    <span className={`sig-badge sig-badge--${tone}`}>
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      {short ? shortLabel : label}
    </span>
  );
};

export default StatusBadge;
