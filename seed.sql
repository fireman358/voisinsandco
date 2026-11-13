-- Seed Voisins & Co (données de démonstration)
-- Généré depuis lib/seed-data.json — ne pas éditer à la main.



INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng) VALUES ('e-brocante', 'Brocante annuelle d''Arquennes', 'Les Amis d''Arquennes (ASBL)', 'Brocante', datetime('now', '+6 days'), 'Place du Village', 'Arquennes', 50.5051, 4.3695);
INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng) VALUES ('e-soupe', 'Soupe populaire de Seneffe', 'Comité de quartier de Seneffe', 'Soupe solidaire', datetime('now', '+3 days'), 'Salle communale, Rue de l''Église 2', 'Seneffe', 50.526, 4.2605);
INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng) VALUES ('e-marche', 'Marché gourmand de Nivelles', 'Ville de Nivelles', 'Marché', datetime('now', '+10 days'), 'Grand-Place', 'Nivelles', 50.5928, 4.3247);
INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng) VALUES ('e-repair', 'Repair Café de Baulers', 'ASBL Baulers en transition', 'Atelier repair', datetime('now', '+17 days'), 'Salle des fêtes', 'Baulers', 50.5795, 4.304);

INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at) VALUES ('n-haie', 'Aide pour tailler une haie de 20 m', 'Haie de thuyas devenue très haute : besoin de bras (et d''une échelle) un samedi matin.', 'entraide', NULL, 'Marie', 'Arquennes', 50.5047, 4.369, 'open', datetime('now', '-2 hours'));
INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at) VALUES ('n-plombier', 'Recherche plombier : fuite sous l''évier', 'Petite fuite continue sous l''évier de la cuisine, goutte à goutte depuis hier soir.', 'artisan', 'Plomberie', 'Jean', 'Seneffe', 50.5265, 4.2595, 'open', datetime('now', '-5 hours'));
INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at) VALUES ('n-chien', 'Garde de chien ce week-end', 'Chien gentil (berger croisé, 4 ans) à garder du vendredi soir au dimanche soir à Nivelles.', 'entraide', NULL, 'Sophie', 'Nivelles', 50.5935, 4.3255, 'open', datetime('now', '-26 hours'));
INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at) VALUES ('n-couvreur', 'Recherche couvreur : gouttière qui fuit', 'Gouttière arrière qui déborde à chaque pluie, besoin d''un pro rapidement.', 'artisan', 'Couverture', 'Luc', 'Baulers', 50.5799, 4.3001, 'open', datetime('now', '-50 hours'));

INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-karcher', 'Kärcher K4 + rotabuse', 'Nettoyeur haute pression 130 bars, parfait pour terrasse, voiture ou façade.', 'Patrick', 'Arquennes', 50.5038, 4.3675, 1);
INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-echelle', 'Échelle aluminium 6 m', 'Échelle 3 parties télescopique, très légère : idéale pour gouttières et petit élagage.', 'Thomas', 'Seneffe', 50.5245, 4.26, 1);
INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-remorque', 'Remorque double essieu', 'Remorque freinée 750 kg : déchets verts, meubles, gravats… attelage standard.', 'Ferme de la Dodaine', 'Arquennes', 50.4965, 4.3552, 1);
INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-raclette', 'Appareil à raclette 8 personnes', 'Appareil 8 poêlons + grill raclette, avec spatules et coupelles.', 'Camille', 'Nivelles', 50.592, 4.3238, 1);
INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-tondeuse', 'Tondeuse thermique', 'Tondeuse essence avec bac, révisée chaque printemps. Actuellement prêtée.', 'Marc', 'Feluy', 50.5505, 4.271, 0);
INSERT INTO tools (id, name, description, owner, town, lat, lng, available) VALUES ('t-perceuse', 'Perceuse-visseuse + mèches', 'Perceuse 18V avec 2 batteries et mèches bois / métal / béton jusqu''à 13 mm.', 'Awa', 'Baulers', 50.5793, 4.3055, 1);
