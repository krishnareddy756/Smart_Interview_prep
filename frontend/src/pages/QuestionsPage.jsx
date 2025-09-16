import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
} from "@mui/material";
import { PlayArrow, Refresh, TextFields, Upload } from "@mui/icons-material";
import { useApp } from "../context/AppContext";
import { generateQuestions } from "../api/questions";
import QuestionCard from "../components/QuestionCard";
import QuestionActions from "../components/QuestionActions";
import ModeSelector from "../components/ModeSelector";
import { useMobile } from "../hooks/useMobile";

const jobRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "Mobile Developer",
  "QA Engineer",
];

const experienceLevels = [
  { value: "fresher", label: "Fresher (0-1 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "experienced", label: "Experienced (5+ years)" },
];

function QuestionsPage() {
  const {
    state,
    setLoading,
    setError,
    setQuestions,
    startInterview,
    resetToUpload,
  } = useApp();
  const { resumeData, questions } = state;

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [practicedQuestions, setPracticedQuestions] = useState([]);
  const [speechSupport] = useState({
    synthesis: "speechSynthesis" in window,
    recognition:
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
  });

  const handleGenerateQuestions = async () => {
    if (!selectedRole || !selectedLevel) {
      setError("Please select both role and experience level");
      return;
    }

    setGeneratingQuestions(true);
    setLoading(true);

    try {
      const questionsData = await generateQuestions({
        role: selectedRole,
        level: selectedLevel,
        resumeSummary: resumeData,
      });

      setQuestions(questionsData);
      setPracticedQuestions([]); // Reset practiced questions
    } catch (error) {
      setError(error.message || "Failed to generate questions");
    } finally {
      setGeneratingQuestions(false);
      setLoading(false);
    }
  };

  const handleMarkPracticed = (questionId, practiced) => {
    setPracticedQuestions((prev) =>
      practiced ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  const handleModeSelect = (mode) => {
    setShowModeSelector(false);
    handleStartInterview(mode);
  };

  const handleStartInterview = (mode = "interactive") => {
    if (!questions) return;

    const allQuestions = [
      ...questions.roleQuestions.map((q, i) => ({
        id: `role-${i}`,
        type: "role",
        text: q,
        order: i,
      })),
      ...questions.openEnded.map((q, i) => ({
        id: `open-${i}`,
        type: "openEnded",
        text: q,
        order: i + questions.roleQuestions.length,
      })),
    ];

    startInterview({
      questions: allQuestions,
      role: selectedRole,
      level: selectedLevel,
      mode: mode,
    });
  };

  const handleShowModeSelector = () => {
    setShowModeSelector(true);
  };

  const handleNewResume = () => {
    resetToUpload();
  };

  if (!resumeData) {
    return (
      <Paper elevation={3} sx={{ p: 4 }}>
        <Alert severity="error">
          No resume data found. Please upload a resume first.
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Resume Summary */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          mb: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#1976d2" }}>
            📄 Resume Analysis
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Skills Section */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#2e7d32" }}
                >
                  🛠️ Technical Skills
                </Typography>
                <Chip
                  label={resumeData.skills?.length || 0}
                  size="small"
                  color="success"
                  sx={{ ml: 1 }}
                />
              </Box>

              {resumeData.skills?.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {resumeData.skills.slice(0, 12).map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        backgroundColor: "#e8f5e8",
                        color: "#2e7d32",
                        fontWeight: 500,
                        "&:hover": {
                          backgroundColor: "#c8e6c9",
                        },
                      }}
                    />
                  ))}
                  {resumeData.skills.length > 12 && (
                    <Chip
                      label={`+${resumeData.skills.length - 12} more`}
                      size="small"
                      variant="outlined"
                      color="success"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  No skills detected. Try uploading a more detailed resume.
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Experience & Education Section */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              {/* Experience */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#ed6c02", mb: 1 }}
                >
                  💼 Experience Level
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: resumeData.experience ? "#333" : "#666",
                    fontStyle: resumeData.experience ? "normal" : "italic",
                  }}
                >
                  {resumeData.experience || "Experience level not detected"}
                </Typography>
              </Box>

              {/* Education */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#9c27b0" }}
                  >
                    🎓 Education
                  </Typography>
                  <Chip
                    label={resumeData.education?.length || 0}
                    size="small"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                </Box>

                {resumeData.education?.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {resumeData.education.slice(0, 3).map((edu, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          p: 1,
                          backgroundColor: "#f3e5f5",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                        }}
                      >
                        {edu}
                      </Typography>
                    ))}
                    {resumeData.education.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{resumeData.education.length - 3} more entries
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No education information detected
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Projects Section */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#1976d2" }}
                >
                  🚀 Projects & Experience
                </Typography>
                <Chip
                  label={resumeData.projects?.length || 0}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>

              {resumeData.projects?.length > 0 ? (
                <Grid container spacing={2}>
                  {resumeData.projects.slice(0, 4).map((project, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e3f2fd",
                          borderRadius: 2,
                          backgroundColor: "#f8fbff",
                          height: "100%",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: "#1976d2",
                            mb: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {project.title || project}
                        </Typography>

                        {project.summary && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mb: 1,
                            }}
                          >
                            {project.summary}
                          </Typography>
                        )}

                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {project.technologies
                                .slice(0, 3)
                                .map((tech, techIndex) => (
                                  <Chip
                                    key={techIndex}
                                    label={tech}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      mr: 0.5,
                                      mb: 0.5,
                                      fontSize: "0.7rem",
                                      height: "20px",
                                    }}
                                  />
                                ))}
                            </Box>
                          )}
                      </Box>
                    </Grid>
                  ))}

                  {resumeData.projects.length > 4 && (
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", mt: 1 }}
                      >
                        +{resumeData.projects.length - 4} more projects detected
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No projects detected. Consider adding project details to
                    your resume for better question personalization.
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Role and Level Selection */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Interview Configuration
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Target Role</InputLabel>
              <Select
                value={selectedRole}
                label="Target Role"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {jobRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={selectedLevel}
                label="Experience Level"
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {experienceLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleGenerateQuestions}
            disabled={!selectedRole || !selectedLevel || generatingQuestions}
            startIcon={<Refresh />}
            size="large"
          >
            {generatingQuestions
              ? "Generating Questions..."
              : "Generate Questions"}
          </Button>
        </Box>
      </Paper>

      {/* Mode Selector Dialog */}
      {showModeSelector && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <ModeSelector
            onModeSelect={handleModeSelect}
            speechSupport={speechSupport}
          />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowModeSelector(false)}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {/* Generated Questions */}
      {questions && !showModeSelector && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Generated Questions
          </Typography>

          {/* Enhanced Question Actions */}
          <QuestionActions
            questions={[
              ...questions.roleQuestions.map((q, i) => ({
                id: `role-${i}`,
                type: "role",
                text: q,
              })),
              ...questions.openEnded.map((q, i) => ({
                id: `open-${i}`,
                type: "openEnded",
                text: q,
              })),
            ]}
            onRegenerate={handleGenerateQuestions}
            onMarkPracticed={handleMarkPracticed}
            practicedQuestions={practicedQuestions}
            role={selectedRole}
            level={selectedLevel}
            loading={generatingQuestions}
          />

          {/* Questions organized by type */}
          <Box sx={{ mb: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Interview Questions (
              {(questions.roleQuestions?.length || 0) +
                (questions.openEnded?.length || 0)}{" "}
              total)
            </Typography>

            {/* Technical Questions */}
            {questions.roleQuestions?.map((questionText, index) => (
              <QuestionCard
                key={`role-${index}`}
                question={{
                  id: `role-${index}`,
                  type: "role",
                  text: questionText,
                }}
                index={index}
                total={
                  (questions.roleQuestions?.length || 0) +
                  (questions.openEnded?.length || 0)
                }
              />
            ))}

            {/* Behavioral Questions */}
            {questions.openEnded?.map((questionText, index) => (
              <QuestionCard
                key={`open-${index}`}
                question={{
                  id: `open-${index}`,
                  type: "openEnded",
                  text: questionText,
                }}
                index={index + (questions.roleQuestions?.length || 0)}
                total={
                  (questions.roleQuestions?.length || 0) +
                  (questions.openEnded?.length || 0)
                }
              />
            ))}
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleShowModeSelector}
              color="primary"
              sx={{
                minWidth: { xs: "100%", sm: "200px" },
                minHeight: "48px",
              }}
            >
              Start Interview
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<TextFields />}
              onClick={() => handleStartInterview("text-only")}
              sx={{
                minWidth: { xs: "100%", sm: "160px" },
                minHeight: "48px",
              }}
            >
              Quick Text Mode
            </Button>
          </Box>

          {/* Additional Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
            }}
          >
            <Button
              variant="text"
              startIcon={<Upload />}
              onClick={handleNewResume}
              size="small"
            >
              Upload New Resume
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default QuestionsPage;
