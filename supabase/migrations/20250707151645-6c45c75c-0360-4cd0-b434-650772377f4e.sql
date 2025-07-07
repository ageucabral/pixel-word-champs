-- Corrigir o XP do usuário ageu.cabral01@gmail.com para o valor correto de 297
UPDATE profiles 
SET experience_points = 297, 
    updated_at = NOW()
WHERE id = 'dafccd97-e393-4f8c-9feb-d48c25cd366e';