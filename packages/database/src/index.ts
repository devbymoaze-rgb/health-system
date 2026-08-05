export {
  Settings,
  Doctor,
  Appointment,
  FollowUp,
  Conversation,
  type ISettings,
  type IDoctor,
  type IAppointment,
  type IFollowUp,
  type IConversation,
} from './models';

export {
  default as connectToDatabase,
  connectToDatabase as connect,
  isDatabaseConnected,
} from './connect';

export {
  connectWorkerDatabase,
  isMockMode,
  patchModelsForMockMode,
} from './mock';

export { Settings as defaultSettings } from './models';
export { default } from './connect';
