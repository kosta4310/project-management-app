import React, { useLayoutEffect } from 'react';
import Header from 'components/header/Header';
import Footer from 'components/footer/Footer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TOASTER from 'utils/constants/TOASTER';
import { getTokenFromLS } from 'utils/func/localStorage';
import { thunkGetUserById } from 'store/authSlice';
import { parseJwt } from 'utils/func/parsejwt';
import { useTranslation } from 'react-i18next';
import {
  modalStatusSelector,
  setModalClose,
  setTaskModalOpen,
  taskDeleteConfirmSelector,
  taskStatusSelector,
} from 'store/modalSlice';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import styles from './mainLayout.module.scss';
import Modal from 'layouts/Modal/Modal';
import ConfirmationModal from 'layouts/Modal/ConfirmationModal/ConfirmationModal';
import TaskModal from 'layouts/Modal/TaskModal/TaskModal';
import Loader from 'components/loader/Loader';
import { getMsgErrorUserGet } from 'utils/func/getMsgErrorUserGet';
import { appSelector, setIsPending } from 'store/appSlice';

type Props = React.HTMLAttributes<HTMLDivElement>;

const MainLayout = ({ children }: Props) => {
  const modalIsOpen = useAppSelector(modalStatusSelector);
  const taskIsOpen = useAppSelector(taskStatusSelector);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isPending } = useAppSelector(appSelector);
  const taskDeleteConfirmMessage = useAppSelector(taskDeleteConfirmSelector);

  useLayoutEffect(() => {
    if (getTokenFromLS()) {
      const token = getTokenFromLS();
      dispatch(thunkGetUserById({ userId: parseJwt(token).id, token: token }))
        .unwrap()
        .then(() => {
          dispatch(setIsPending(false));
        })
        .catch((err) => {
          dispatch(setIsPending(false));
          toast.error(t(getMsgErrorUserGet(err)));
        });
    } else {
      dispatch(setIsPending(false));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      dispatch(setModalClose());
    }

    if (taskDeleteConfirmMessage) {
      dispatch(setTaskModalOpen());
    }
  };

  return (
    <>
      {modalIsOpen && (
        <Modal onClose={closeModal}>
          {taskIsOpen ? (
            <TaskModal onClose={closeModal} />
          ) : (
            <ConfirmationModal onClose={closeModal} />
          )}
        </Modal>
      )}
      <ToastContainer autoClose={TOASTER.time} />

      <div className={styles.container}>
        <Loader status={isPending} />
        <Header />
        <main className={styles.main}>{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default MainLayout;
