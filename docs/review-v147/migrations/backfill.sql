-- Existing completed records are queued for owner review, never approved automatically.
UPDATE matches SET review_minimum=(SELECT CASE WHEN runs.fighter='BRAX' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9600 ELSE 0 END ELSE 20889 END
WHEN runs.fighter='BRAX' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8972 ELSE 0 END ELSE 19955 END
WHEN runs.fighter='BRAX' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7539 ELSE 0 END ELSE 15219 END
WHEN runs.fighter='NYXA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 12185 ELSE 0 END ELSE 25267 END
WHEN runs.fighter='NYXA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9356 ELSE 0 END ELSE 19622 END
WHEN runs.fighter='NYXA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8230 ELSE 0 END ELSE 17369 END
WHEN runs.fighter='VEXA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 10688 ELSE 0 END ELSE 23820 END
WHEN runs.fighter='VEXA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8883 ELSE 0 END ELSE 19264 END
WHEN runs.fighter='VEXA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6694 ELSE 0 END ELSE 14016 END
WHEN runs.fighter='KROV' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7680 ELSE 0 END ELSE 15360 END
WHEN runs.fighter='KROV' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8115 ELSE 0 END ELSE 16640 END
WHEN runs.fighter='KROV' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7372 ELSE 0 END ELSE 15577 END
WHEN runs.fighter='NINA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7641 ELSE 0 END ELSE 15283 END
WHEN runs.fighter='NINA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7449 ELSE 0 END ELSE 16064 END
WHEN runs.fighter='NINA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7052 ELSE 0 END ELSE 14528 END
WHEN runs.fighter='DANNY' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 11558 ELSE 0 END ELSE 23116 END
WHEN runs.fighter='DANNY' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9241 ELSE 0 END ELSE 20787 END
WHEN runs.fighter='DANNY' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7116 ELSE 0 END ELSE 15718 END
WHEN runs.fighter='BEAR' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 5644 ELSE 0 END ELSE 11289 END
WHEN runs.fighter='BEAR' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 4211 ELSE 0 END ELSE 8729 END
WHEN runs.fighter='BEAR' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 4518 ELSE 0 END ELSE 9036 END
WHEN runs.fighter='DEMON' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6489 ELSE 0 END ELSE 12979 END
WHEN runs.fighter='DEMON' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6502 ELSE 0 END ELSE 13235 END
WHEN runs.fighter='DEMON' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6400 ELSE 0 END ELSE 14489 END ELSE 0 END FROM runs WHERE runs.id=matches.run_id AND runs.mode IN ('fight','arcade','tournament','survival')),review_status=1 WHERE finished=1 AND review_status=0 AND elapsed<1.5*(SELECT CASE WHEN runs.fighter='BRAX' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9600 ELSE 0 END ELSE 20889 END
WHEN runs.fighter='BRAX' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8972 ELSE 0 END ELSE 19955 END
WHEN runs.fighter='BRAX' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7539 ELSE 0 END ELSE 15219 END
WHEN runs.fighter='NYXA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 12185 ELSE 0 END ELSE 25267 END
WHEN runs.fighter='NYXA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9356 ELSE 0 END ELSE 19622 END
WHEN runs.fighter='NYXA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8230 ELSE 0 END ELSE 17369 END
WHEN runs.fighter='VEXA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 10688 ELSE 0 END ELSE 23820 END
WHEN runs.fighter='VEXA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8883 ELSE 0 END ELSE 19264 END
WHEN runs.fighter='VEXA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6694 ELSE 0 END ELSE 14016 END
WHEN runs.fighter='KROV' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7680 ELSE 0 END ELSE 15360 END
WHEN runs.fighter='KROV' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 8115 ELSE 0 END ELSE 16640 END
WHEN runs.fighter='KROV' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7372 ELSE 0 END ELSE 15577 END
WHEN runs.fighter='NINA' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7641 ELSE 0 END ELSE 15283 END
WHEN runs.fighter='NINA' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7449 ELSE 0 END ELSE 16064 END
WHEN runs.fighter='NINA' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7052 ELSE 0 END ELSE 14528 END
WHEN runs.fighter='DANNY' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 11558 ELSE 0 END ELSE 23116 END
WHEN runs.fighter='DANNY' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 9241 ELSE 0 END ELSE 20787 END
WHEN runs.fighter='DANNY' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 7116 ELSE 0 END ELSE 15718 END
WHEN runs.fighter='BEAR' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 5644 ELSE 0 END ELSE 11289 END
WHEN runs.fighter='BEAR' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 4211 ELSE 0 END ELSE 8729 END
WHEN runs.fighter='BEAR' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 4518 ELSE 0 END ELSE 9036 END
WHEN runs.fighter='DEMON' AND runs.difficulty='easy' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6489 ELSE 0 END ELSE 12979 END
WHEN runs.fighter='DEMON' AND runs.difficulty='normal' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6502 ELSE 0 END ELSE 13235 END
WHEN runs.fighter='DEMON' AND runs.difficulty='hard' THEN CASE WHEN runs.mode='survival' THEN CASE WHEN matches.wins>0 THEN 6400 ELSE 0 END ELSE 14489 END ELSE 0 END FROM runs WHERE runs.id=matches.run_id AND runs.mode IN ('fight','arcade','tournament','survival'));
