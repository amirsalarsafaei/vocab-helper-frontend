import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SpellingMode from "./SpellingMode";
import NormalMode from "./NormalMode";
import { Button, Container, Typography, Box } from "@mui/material";

type PracticeMode = "spelling" | "normal" | null;

const Practice: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<PracticeMode>(() => {
    const urlMode = searchParams.get("mode") as PracticeMode;
    return urlMode && (urlMode === "spelling" || urlMode === "normal") ? urlMode : null;
  });
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleModeSelect = (selectedMode: PracticeMode) => {
    setMode(selectedMode);
    if (selectedMode) {
      setSearchParams({ mode: selectedMode });
    } else {
      setSearchParams({});
    }
  };

  if (!isStarted && !mode) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleStart}
          >
            Start Practice
          </Button>
        </Box>
      </Container>
    );
  }

  if (!mode) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 3,
          minHeight: '50vh',
          paddingTop: 4
        }}>
          <Typography variant="h4" component="h2">
            Select Practice Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleModeSelect("spelling")}
            >
              Spelling Mode
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => handleModeSelect("normal")}
            >
              Normal Mode
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {mode === "spelling" ? <SpellingMode /> : <NormalMode />}
    </Container>
  );
};

export default Practice;
