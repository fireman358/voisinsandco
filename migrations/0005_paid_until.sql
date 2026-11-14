-- Échéance d'abonnement des fiches payantes (ISO YYYY-MM-DD, NULL = illimité/inconnu)
ALTER TABLE businesses ADD COLUMN paid_until TEXT;
