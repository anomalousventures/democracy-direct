DELETE FROM bills
WHERE bill_number LIKE '%.%'
  AND EXISTS (
    SELECT 1 FROM bills AS clean
    WHERE clean.congress = bills.congress
      AND clean.bill_type = bills.bill_type
      AND clean.bill_number = SUBSTRING(bills.bill_number FROM POSITION('.' IN bills.bill_number) + 1)
  );--> statement-breakpoint
UPDATE bills
SET bill_number = SUBSTRING(bill_number FROM POSITION('.' IN bill_number) + 1)
WHERE bill_number LIKE '%.%';