"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportQueryInput } from "@/lib/validation";
import { downloadCsv } from "@/lib/api/timeEntries";

export function CSVExportButton({ params }: { params: Partial<ExportQueryInput> }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      loading={loading}
      icon={<FileDown className="h-4 w-4" />}
      onClick={async () => {
        setLoading(true);
        try {
          await downloadCsv(params);
        } finally {
          setLoading(false);
        }
      }}
    >
      Export CSV
    </Button>
  );
}
