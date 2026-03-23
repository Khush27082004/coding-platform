router.get('/users', authenticate, authorize('admin'), authController.getUsers);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);

export default router;
