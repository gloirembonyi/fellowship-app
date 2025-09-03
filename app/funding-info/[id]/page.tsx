"use client";

import { useState } from "react";
import FundingInfoForm from "@/components/funding-info-form";

export default function FundingInfoPage({ params }: { params: { id: string } }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <FundingInfoForm applicationId={params.id} darkMode={darkMode} />
    </div>
  );
}
