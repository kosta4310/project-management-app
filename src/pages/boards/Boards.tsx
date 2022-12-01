import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import {
  boardsSelector,
  thunkGetUserBoards,
  thunkCreateBoards,
  BoardType,
  thunkDeleteBoard,
} from 'store/boardsSlice';
import {
  BtnColor,
  ModalAction,
  modalActionSelector,
  resetModal,
  setModalOpen,
  userDescriptionSelector,
  userTitleSelector,
} from 'store/modalSlice';
import { useTranslation } from 'react-i18next';
import Icon from 'components/Icon/Icon';
import pencil from 'assets/images/pencil.png';
import styles from './boards.module.scss';
import { userSelector } from 'store/authSlice';
import { getTokenFromLS } from 'utils/func/localStorage';
import Search from 'components/search/search';

const Boards = () => {
  const [selectedBoard, setSelectedBoard] = useState<string>();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const modalAction = useAppSelector(modalActionSelector);
  const userInputTitle = useAppSelector(userTitleSelector);
  const userInputDescr = useAppSelector(userDescriptionSelector);
  const user = useAppSelector(userSelector);
  const boards = useAppSelector(boardsSelector);
  const initialRenderBoards = useRef(boards.length);
  const [newBoards, setNewBoards] = useState<BoardType[]>(boards);

  useEffect(() => {
    if (initialRenderBoards.current === 0) {
      dispatch(thunkGetUserBoards(getTokenFromLS()));
    }
  }, [dispatch]);

  useEffect(() => {
    setNewBoards(boards);
  }, [boards]);
  const navigateToBoardPage = (id: string) => {
    navigate(`/boards/${id}`);
  };

  const createBoardHandler = () => {
    dispatch(
      setModalOpen({
        title: `${t('BOARDS.CREATE')}`,
        inputTitle: `${t('MODAL.TITLE')}`,
        inputDescr: `${t('MODAL.DESCRIPTION')}`,
        color: BtnColor.BLUE,
        btnText: `${t('MODAL.CREATE')}`,
        action: ModalAction.BOARD_CREATE,
      })
    );
  };

  const deleteBoardHandler = (event: React.MouseEvent, board: BoardType) => {
    event.stopPropagation();
    dispatch(
      setModalOpen({
        message: `${t('MODAL.DELETE_MSG')} ${board.title.title}?`,
        color: BtnColor.RED,
        btnText: `${t('MODAL.DELETE')}`,
        action: ModalAction.BOARD_DELETE,
      })
    );
    setSelectedBoard(board._id);
  };

  useEffect(() => {
    if (modalAction === ModalAction.BOARD_CREATE) {
      const info = JSON.stringify({ title: userInputTitle, descr: userInputDescr });
      dispatch(
        thunkCreateBoards({
          owner: user._id,
          title: info,
          users: [user._id],
          token: getTokenFromLS(),
        })
      );
      dispatch(resetModal());
    }

    if (modalAction === ModalAction.BOARD_DELETE && typeof selectedBoard === 'string') {
      dispatch(thunkDeleteBoard({ boardId: selectedBoard, token: getTokenFromLS() }));
      dispatch(resetModal());
    }
  }, [modalAction, dispatch, selectedBoard, userInputTitle, userInputDescr, user._id]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.wrapperTop}>
        <h2 className={styles.title}>{t('BOARDS.TITLE')}</h2>
        <Search boards={boards} setNewBoards={setNewBoards} />
      </div>
      <ul className={styles.list}>
        <li className={`${styles.card} ${styles.cardCreate}`} onClick={createBoardHandler}>
          <h3 className={`${styles.cardName} ${styles.cardCreateName}`}>{t('BOARDS.CREATE')}</h3>
          <img src={pencil} alt="yellow pencil" className={styles.image} />
        </li>
        {newBoards.map((board) => (
          <li
            key={board._id}
            className={styles.card}
            onClick={() => navigateToBoardPage(board._id)}
          >
            <div className={styles.titleWrapper}>
              <h3 className={styles.cardName}>{board.title.title}</h3>
              <button className={styles.button} onClick={(e) => deleteBoardHandler(e, board)}>
                <Icon color="#CC0707" size={100} icon="trash" className={styles.icon} />
              </button>
            </div>
            <p className={styles.description}>{board.title.descr}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Boards;
