import React from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  TextFields,
  RecordVoiceOver,
  Check,
  Close,
  Edit,
  Mic
} from '@mui/icons-material'

/**
 * Mode selection component for choosing between text-only and interactive interview
 */
function ModeSelector({ onModeSelect, speechSupport }) {
  const modes = [
    {
      id: 'text',
      title: 'Text-Only Mode',
      description: 'Practice with written questions and text answers',
      icon: <TextFields fontSize="large" />,
      color: 'primary',
      features: [
        { text: 'Read questions at your own pace', supported: true },
        { text: 'Type your answers', supported: true },
        { text: 'Copy questions easily', supported: true },
        { text: 'Works on all devices', supported: true },
        { text: 'No microphone required', supported: true }
      ],
      benefits: [
        'Perfect for quiet environments',
        'Great for detailed written responses',
        'No technical requirements'
      ]
    },
    {
      id: 'interactive',
      title: 'Interactive Interview',
      description: 'Realistic interview simulation with speech',
      icon: <RecordVoiceOver fontSize="large" />,
      color: 'secondary',
      features: [
        { text: 'Questions read aloud', supported: speechSupport?.synthesis },
        { text: 'Voice answer recording', supported: speechSupport?.recognition },
        { text: 'Real-time transcription', supported: speechSupport?.recognition },
        { text: 'Timed responses', supported: true },
        { text: 'Interview-like experience', supported: true }
      ],
      benefits: [
        'Simulates real interview conditions',
        'Improves verbal communication',
        'Builds confidence speaking'
      ],
      requirements: [
        'Microphone access required',
        'Modern browser needed',
        'Quiet environment recommended'
      ]
    }
  ]

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Choose Your Interview Mode
      </Typography>
      
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        Select the interview format that works best for you. You can always switch modes later.
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {modes.map((mode) => (
          <Grid item xs={12} md={6} key={mode.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${mode.color}.main`, mr: 2 }}>
                    {mode.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h3">
                      {mode.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mode.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Features List */}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Features:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {mode.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {feature.supported ? (
                          <Check color="success" fontSize="small" />
                        ) : (
                          <Close color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature.text}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: feature.supported ? 'text.primary' : 'text.disabled'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Benefits */}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Benefits:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {mode.benefits.map((benefit, index) => (
                    <Chip
                      key={index}
                      label={benefit}
                      size="small"
                      variant="outlined"
                      color={mode.color}
                    />
                  ))}
                </Box>

                {/* Requirements (for interactive mode) */}
                {mode.requirements && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {mode.requirements.map((requirement, index) => (
                        <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Typography variant="body2" color="text.secondary">
                              •
                            </Typography>
                          </ListItemIcon>
                          <ListItemText 
                            primary={requirement}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {/* Compatibility Warning */}
                {mode.id === 'interactive' && (!speechSupport?.synthesis || !speechSupport?.recognition) && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.50', borderRadius: 1, border: 1, borderColor: 'warning.200' }}>
                    <Typography variant="caption" color="warning.dark">
                      ⚠️ Some speech features may not be available in your browser. 
                      {!speechSupport?.synthesis && ' Text-to-speech not supported.'}
                      {!speechSupport?.recognition && ' Speech recognition not supported.'}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <Divider />
              
              <CardActions sx={{ p: 2, pt: 1 }}>
                <Button
                  variant="contained"
                  color={mode.color}
                  fullWidth
                  size="large"
                  onClick={() => onModeSelect(mode.id)}
                  disabled={mode.id === 'interactive' && !speechSupport?.synthesis && !speechSupport?.recognition}
                  startIcon={mode.id === 'text' ? <Edit /> : <Mic />}
                >
                  Start {mode.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Try both modes to see which one helps you practice more effectively
        </Typography>
      </Box>
    </Box>
  )
}

export default ModeSelector