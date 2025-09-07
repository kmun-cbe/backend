/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the table `users` without a default value. This is not possible if the table is not empty.

*/

-- First, add the column as nullable
ALTER TABLE "users" ADD COLUMN "userId" TEXT;

-- Update existing users with custom user IDs (handle up to 999 users)
DO $$
DECLARE
    user_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR user_record IN 
        SELECT id FROM "users" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "users" 
        SET "userId" = 'KMUN25' || LPAD(counter::TEXT, 3, '0')
        WHERE id = user_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Now make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");