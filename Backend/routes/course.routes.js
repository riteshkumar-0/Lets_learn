import { Router } from 'express';
import {
  addLectureToCourseById,
  createCourse,
  deleteCourseById,
  editLectureByCourseIdAndLectureId,
  getAllCourses,
  getLecturesByCourseId,
  getSearchedCourse,
  removeLectureFromCourse,
  updateCourseById,
} from '../controllers/course.controller.js';

import upload from '../middlewares/multer.middleware.js';
import { authorizedRoles, isLoggedIn ,authorizeSubscriber} from '../middlewares/auth.middleware.js';

const router = Router();

// Refactored code
router
  .route('/')
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse
  )
  .delete(isLoggedIn, authorizedRoles('ADMIN'), removeLectureFromCourse);

router
     .route('/search')
     .get(getSearchedCourse)  

router
  .route('/:id')
  .get(isLoggedIn,authorizedRoles('ADMIN'), getLecturesByCourseId) 
  .post(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single('lecture'),
    addLectureToCourseById
  )
  .put(isLoggedIn, authorizedRoles('ADMIN'), updateCourseById)
  .delete(isLoggedIn,authorizedRoles('ADMIN'),deleteCourseById);

  router.route("/:courseId/:lectureId")
         .put(isLoggedIn,authorizedRoles('ADMIN'),editLectureByCourseIdAndLectureId)
         .delete(isLoggedIn,authorizedRoles('ADMIN'),removeLectureFromCourse)
export default router;